import { CommissionStatus, PayoutStatus } from "../generated/prisma";
import { prisma } from "../prisma";
import { getStripeClient } from "../stripe";

export async function sendMoney(stripeAccountId: string, affiliateId: string) {
  const stripe = getStripeClient();

  return prisma.$transaction(async (tx) => {
    // 1️⃣ Lock eligible commissions (PREVENT DOUBLE PAYOUT)
    const commissions = await tx.$queryRaw<
      { id: string; amount: number }[]
    >`
      SELECT id, amount 
      FROM "commissions"
      WHERE "affiliateId" = ${affiliateId}
        AND status = 'APPROVED'
        AND "payoutId" IS NULL
        AND "status" != 'CANCELLED'
      FOR UPDATE SKIP LOCKED
    `;

    if (!commissions.length) return null;

    const amount = commissions.reduce((s, c) => s + c.amount, 0);

    // 2️⃣ Create payout record (source of truth)
    const payout = await tx.payout.create({
      data: {
        affiliateId,
        amount,
        method: "STRIPE",
        status: PayoutStatus.PROCESSING,
      },
    });

    // 3️⃣ Ledger HOLD entry
    await tx.ledgerEntry.create({
      data: {
        affiliateId,
        type: "PAYOUT_HOLD",
        amount,
        referenceType: "PAYOUT",
        referenceId: payout.id,
      },
    });

    return { payout, commissions };
  })
  .then(async (data) => {
    if (!data) return null;
    const { payout, commissions } = data;
    if (!payout) return null;

    // 4️⃣ Validate Stripe account
    const account = await stripe.accounts.retrieve(stripeAccountId);
    if (!account.charges_enabled || !account.payouts_enabled) {
      throw new Error("Stripe account not payout-enabled");
    }

    // 5️⃣ Stripe Transfer (idempotent)
    const transfer = await stripe.transfers.create(
      {
        amount: Math.round(payout.amount * 100),
        currency: "usd",
        destination: stripeAccountId,
        description: `Affiliate payout ${payout.id}`,
        metadata: { payoutId: payout.id, affiliateId: payout.affiliateId },
      },
      { idempotencyKey: payout.id }
    );

    // 6️⃣ Finalize payout + commissions atomically
    await prisma.$transaction(async (tx) => {
      await tx.commission.updateMany({
        where: { id: { in: commissions.map(c => c.id) } },
        data: {
          payoutId: payout.id,
          status: CommissionStatus.PAID,
          paidAt: new Date(),
        },
      });

      await tx.payout.update({
        where: { id: payout.id },
        data: {
          status: PayoutStatus.COMPLETED,
          transactionId: transfer.id,
          processedAt: new Date(),
          completedAt: new Date(),
        },
      });

      await tx.ledgerEntry.create({
        data: {
          affiliateId: payout.affiliateId,
          type: "PAYOUT_SENT",
          amount: payout.amount,
          referenceType: "PAYOUT",
          referenceId: payout.id,
        },
      });
    });

    return transfer;
  })
  .catch(async (error) => {
    console.error("Payout failed:", error);

    // Mark payout failed if created
    if ((error as any).payout?.id) {
      await prisma.payout.update({
        where: { id: (error as any).payout.id },
        data: {
          status: PayoutStatus.FAILED,
          failureReason: String(error),
        },
      });
    }

    throw error;
  });
}
