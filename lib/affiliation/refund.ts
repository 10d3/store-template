import { prisma } from "../prisma";
// import { inngest } from "../inngest/client";

/**
 * Reverses a single commission after a refund.
 *
 * Balance semantics (LedgerType has no dedicated REVERSAL type, so the
 * reversal is recorded as a negative DEBIT entry):
 * - Commission not yet transferred (APPROVED/PENDING): balances are
 *   decremented directly — the money never left.
 * - Transfer already completed (payoutId set + payout COMPLETED with a
 *   non-null transactionId): the money already left the account, so we use
 *   deduct-from-future — availableBalance is still decremented (it may go
 *   negative) and a negative DEBIT ledger entry records the clawback. Future
 *   commissions refill the balance, and the payout threshold
 *   (availableBalance >= 50) blocks payouts until the debt is repaid.
 */
export async function refund({
  orderId,
  commissionId,
  reason,
  processedBy,
}: {
  orderId: string;
  commissionId: string;
  reason: string;
  processedBy?: string;
}) {

  console.warn("Refunding commission:", { orderId, commissionId, reason, processedBy });

  if (!commissionId) throw new Error("Missing commissionId");

  return await prisma.$transaction(async (tx) => {
    // 1️⃣ Fetch commission with related affiliate, referral and payout
    const commission = await tx.commission.findUnique({
      where: { id: commissionId },
      include: { affiliate: true, referral: true, payout: true },
    });

    if (!commission) throw new Error("Commission not found");

    // Idempotency: repeated refund events (e.g. partial refunds redelivered)
    // must not double-decrement affiliate balances.
    if (commission.status === "CANCELLED") {
      return { updatedCommission: commission, updatedReferral: commission.referral };
    }

    const transferCompleted =
      !!commission.payoutId &&
      commission.payout?.status === "COMPLETED" &&
      !!commission.payout?.transactionId;

    // 2️⃣ Update commission status
    const updatedCommission = await tx.commission.update({
      where: { id: commissionId },
      data: {
        status: "CANCELLED",
        notes: `${transferCompleted ? "Refunded after completed transfer (deducted from future balance)" : "Refunded"}: ${reason || "No reason provided"}`,
        updatedAt: new Date(),
      },
    });

    // 3️⃣ Update referral status
    const updatedReferral = await tx.referral.update({
      where: { id: commission.referralId },
      data: { status: "REFUNDED" },
    });

    // 4️⃣ Reverse earnings regardless of APPROVED/PAID. For completed
    // transfers this drives availableBalance negative = owed back.
    await tx.affiliate.update({
      where: { id: commission.affiliateId },
      data: {
        totalEarnings: { decrement: commission.amount },
        lifetimeEarnings: { decrement: commission.amount },
        availableBalance: { decrement: commission.amount },
      },
    });

    // 5️⃣ Negative DEBIT ledger entry referencing the reversed commission
    await tx.ledgerEntry.create({
      data: {
        affiliateId: commission.affiliateId,
        type: "DEBIT",
        amount: -commission.amount,
        referenceType: "COMMISSION",
        referenceId: commission.id,
      },
    });

    // 6️⃣ Emit refund event (optional)
    // await inngest.send({
    //   name: "affiliate/commission.refunded",
    //   data: {
    //     commissionId,
    //     affiliateId: commission.affiliateId,
    //     amount: commission.amount,
    //     orderId,
    //     reason,
    //     processedBy,
    //   },
    // });

    return { updatedCommission, updatedReferral };
  });
}
