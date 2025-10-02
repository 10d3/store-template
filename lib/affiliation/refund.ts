import { prisma } from "../prisma";

//orderId, commissionId, reason
export async function refund({
  orderId,
  commissionId,
  reason,
}: {
  orderId: string;
  commissionId: string;
  reason: string;
}) {
  try {
    console.log(orderId);

    if (!commissionId) {
      throw new Error("Missing commissionId");
    }

    // Find commission
    const commission = await prisma.commission.findUnique({
      where: { id: commissionId },
      include: {
        affiliate: true,
        referral: true,
      },
    });

    if (!commission) {
      throw new Error("Commission not found");
    }

    // Update commission status to CANCELLED
    await prisma.commission.update({
      where: { id: commissionId },
      data: {
        status: "CANCELLED",
        notes: `Refunded: ${reason || "No reason provided"}`,
      },
    });

    // Update referral status
    const result = await prisma.referral.update({
      where: { id: commission.referralId },
      data: {
        status: "REFUNDED",
      },
    });

    // Deduct from affiliate earnings (only if not already paid)
    if (commission.status !== "PAID") {
      await prisma.affiliate.update({
        where: { id: commission.affiliateId },
        data: {
          totalEarnings: { decrement: commission.amount },
          availableBalance: { decrement: commission.amount },
        },
      });
    }

    return result;
  } catch (error) {
    console.error(error);
    throw new Error(error instanceof Error ? error.message : String(error));
  }
}
