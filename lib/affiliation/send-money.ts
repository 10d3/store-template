import { CommissionStatus, PayoutStatus } from "../generated/prisma";
import { prisma } from "../prisma";
import { getStripeClient } from "../stripe";

interface PayoutNotes {
  expectedCount?: number;
  expectedAmount?: number;
}

function parsePayoutNotes(notes: string | null): PayoutNotes | null {
  if (!notes) return null;
  try {
    const parsed = JSON.parse(notes) as PayoutNotes;
    return typeof parsed === "object" && parsed !== null ? parsed : null;
  } catch {
    return null;
  }
}

/**
 * Executes the money transfer for ONE existing payout.
 *
 * Pipeline: claim → validate account → Stripe transfer → finalize (DB + ledger).
 * Callers wrap the whole call in a single Inngest step.run; replay-safety comes
 * from the COMPLETED short-circuit, atomic DB transactions and the stable
 * idempotency key below.
 *
 * - Commissions are claimed atomically inside a transaction: updateMany sets
 *   payoutId on APPROVED commissions with payoutId=null; if the claimed count
 *   doesn't match the batch's expected count, the transaction rolls back and
 *   releases everything.
 * - The Stripe transfer uses the STABLE idempotency key `payout_<payoutId>`,
 *   so any replay after a crash returns the same transfer — never double-pay.
 * - Commissions are marked PAID, the payout COMPLETED and the PAYOUT_SENT
 *   ledger entry written ONLY after the transfer is confirmed.
 * - If the transfer did NOT confirm: payout → FAILED and its commissions are
 *   released back to APPROVED (payoutId=null) so a later run retries cleanly.
 */
export async function sendMoney(payoutId: string) {
  const stripe = getStripeClient();

  // 1️⃣ Claim the commissions for THIS payout atomically.
  const claimed = await (async () => {
    return prisma.$transaction(async (tx) => {
      const payout = await tx.payout.findUnique({
        where: { id: payoutId },
        include: { affiliate: true, commissions: true },
      });
      if (!payout) throw new Error(`Payout ${payoutId} not found`);

      const destination = payout.affiliate.bankAccount;
      if (!destination || !destination.trim()) {
        throw new Error(`Affiliate ${payout.affiliateId} has no bank account configured`);
      }

      // Retry after the payout already completed — nothing left to do.
      if (payout.status === PayoutStatus.COMPLETED) {
        return { payout, destination, commissions: payout.commissions, alreadyCompleted: true };
      }

      // Commissions claimed by an earlier crashed attempt: reuse them.
      let commissions = payout.commissions;

      if (!commissions.length) {
        const expected = parsePayoutNotes(payout.notes);

        const res = await tx.commission.updateMany({
          where: {
            affiliateId: payout.affiliateId,
            status: CommissionStatus.APPROVED,
            payoutId: null,
          },
          data: { payoutId: payout.id },
        });

        // Mismatch throws INSIDE the transaction → full rollback releases
        // whatever was just claimed.
        if (expected?.expectedCount !== undefined && res.count !== expected.expectedCount) {
          throw new Error(
            `Claim mismatch for payout ${payout.id}: expected ${expected.expectedCount} commissions, claimed ${res.count}`
          );
        }

        commissions = await tx.commission.findMany({ where: { payoutId: payout.id } });
        if (!commissions.length) {
          throw new Error(`No commissions claimable for payout ${payout.id}`);
        }
      }

      return { payout, destination, commissions, alreadyCompleted: false };
    });
  })();

  if (claimed.alreadyCompleted) {
    console.log(`[send-money] payout ${payoutId} already completed, skipping`);
    return null;
  }

  const { payout, destination, commissions } = claimed;
  const amount = commissions.reduce((s, c) => s + c.amount, 0);

  let transferConfirmed = false;
  try {
    // 2️⃣ Validate the connected account can receive payouts.
    const account = await stripe.accounts.retrieve(destination);
    if (!account.charges_enabled || !account.payouts_enabled) {
      throw new Error("Stripe account not payout-enabled");
    }

    // 3️⃣ Stripe transfer with a STABLE idempotency key — safe across retries.
    const transfer = await stripe.transfers.create(
      {
        amount: Math.round(amount * 100),
        currency: "usd",
        destination,
        description: `Affiliate payout ${payout.id}`,
        metadata: { payoutId: payout.id, affiliateId: payout.affiliateId },
      },
      { idempotencyKey: `payout_${payout.id}` }
    );
    transferConfirmed = true;

    // 4️⃣ Finalize ONLY after confirmed success (single atomic transaction:
    // commissions PAID + payout COMPLETED + PAYOUT_SENT ledger).
    await prisma.$transaction([
      prisma.commission.updateMany({
        where: { id: { in: commissions.map((c) => c.id) } },
        data: {
          payoutId: payout.id,
          status: CommissionStatus.PAID,
          paidAt: new Date(),
        },
      }),
      prisma.payout.update({
        where: { id: payout.id },
        data: {
          status: PayoutStatus.COMPLETED,
          transactionId: transfer.id,
          processedAt: new Date(),
          completedAt: new Date(),
        },
      }),
      prisma.ledgerEntry.create({
        data: {
          affiliateId: payout.affiliateId,
          type: "PAYOUT_SENT",
          amount,
          referenceType: "PAYOUT",
          referenceId: payout.id,
        },
      }),
    ]);

    return transfer;
  } catch (error) {
    console.error(`[send-money] payout ${payoutId} failed:`, error);

    if (!transferConfirmed) {
      // Transfer never confirmed → mark FAILED and release the commissions
      // back to APPROVED so a later batch/run retries cleanly.
      await prisma
        .$transaction([
          prisma.payout.update({
            where: { id: payoutId },
            data: { status: PayoutStatus.FAILED, failureReason: String(error) },
          }),
          prisma.commission.updateMany({
            where: { payoutId },
            data: { payoutId: null },
          }),
        ])
        .catch((releaseErr) =>
          console.error(`[send-money] failed to release payout ${payoutId}:`, releaseErr)
        );
    }
    // If the transfer DID confirm but post-processing failed, do NOT release:
    // replaying hits the stable idempotencyKey and re-finalizes safely.

    throw error;
  }
}
