import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function getAffiliatePaymentData() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) return null;

  const affiliate = await prisma.affiliate.findUnique({
    where: { userId: session.user.id },
    include: {
      payouts: {
        orderBy: { createdAt: "desc" },
        take: 5,
      },
    },
  });

  if (!affiliate) return null;

  // Calculate pending payment (approved commissions not yet paid)
  const pendingCommissions = await prisma.commission.findMany({
    where: {
      affiliateId: affiliate.id,
      status: "APPROVED",
      payoutId: null,
    },
  });

  const pendingPayment = pendingCommissions.reduce(
    (sum, commission) => sum + commission.amount,
    0
  );

  // Get next payment date (15th or end of month, whichever is closer)
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  
  const fifteenth = new Date(currentYear, currentMonth, 15);
  const endOfMonth = new Date(currentYear, currentMonth + 1, 0);
  
  let nextPaymentDate = fifteenth;
  if (today > fifteenth) {
    nextPaymentDate = endOfMonth;
  }
  if (today > endOfMonth) {
    nextPaymentDate = new Date(currentYear, currentMonth + 1, 15);
  }

  return {
    totalEarnings: affiliate.lifetimeEarnings,
    pendingPayment,
    nextPaymentDate,
    stripeConnectId: affiliate.paymentMethod === "STRIPE" ? affiliate.bankAccount : null,
    recentPayouts: affiliate.payouts.map(payout => ({
      id: payout.id,
      amount: payout.amount,
      date: payout.completedAt || payout.createdAt,
      status: payout.status,
    })),
  };
}