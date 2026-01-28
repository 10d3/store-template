import { prisma } from "../prisma";
// import { inngest } from "../inngest/client";

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
    // 1️⃣ Fetch commission with related affiliate and referral
    const commission = await tx.commission.findUnique({
      where: { id: commissionId },
      include: { affiliate: true, referral: true },
    });

    if (!commission) throw new Error("Commission not found");

    // 2️⃣ Update commission status
    const updatedCommission = await tx.commission.update({
      where: { id: commissionId },
      data: {
        status: "CANCELLED",
        notes: `Refunded: ${reason || "No reason provided"}`,
        updatedAt: new Date(),
      },
    });

    // 3️⃣ Update referral status
    const updatedReferral = await tx.referral.update({
      where: { id: commission.referralId },
      data: { status: "REFUNDED" },
    });

    // 4️⃣ Deduct from affiliate earnings if commission not paid
    if (commission.status !== "PAID") {
      await tx.affiliate.update({
        where: { id: commission.affiliateId },
        data: {
          totalEarnings: { decrement: commission.amount },
          availableBalance: { decrement: commission.amount },
        },
      });
    }

    // 5️⃣ Emit refund event (optional)
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
