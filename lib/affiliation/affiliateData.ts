import { headers } from "next/headers";
import { auth } from "../auth";
import { prisma } from "../prisma";

export async function getAffiliationData() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }

    const affiliate = await prisma.affiliate.findUnique({
      where: { userId: session.user.id },
      include: {
        referrals: {
          where: {
            status: "COMPLETED",
          },
          include: {
            commissions: {
              orderBy: {
                createdAt: "desc",
              },
            },
          },
          orderBy: {
            convertedAt: "desc",
          },
        },
        commissions: {
          orderBy: {
            createdAt: "desc",
          },
          take: 10,
          include: {
            referral: true,
          },
        },
        clicks: {
          orderBy: {
            createdAt: "desc",
          },
          take: 20,
        },
      },
    });

    if (!affiliate) {
      throw new Error("Affiliate not found");
    }

    // Calculate conversion rate
    const conversionRate =
      affiliate.totalClicks > 0
        ? (affiliate.totalConversions / affiliate.totalClicks) * 100
        : 0;

    // Calculate pending commissions
    const pendingCommissions = await prisma.commission.aggregate({
      where: {
        affiliateId: affiliate.id,
        status: "PENDING",
      },
      _sum: {
        amount: true,
      },
    });

    // Get recent sales (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentSales = await prisma.referral.count({
      where: {
        affiliateId: affiliate.id,
        status: "COMPLETED",
        convertedAt: {
          gte: thirtyDaysAgo,
        },
      },
    });

    const recentEarnings = await prisma.commission.aggregate({
      where: {
        affiliateId: affiliate.id,
        status: { in: ["APPROVED", "PAID"] },
        createdAt: {
          gte: thirtyDaysAgo,
        },
      },
      _sum: {
        amount: true,
      },
    });

    return {
      affiliate: {
        id: affiliate.id,
        referralCode: affiliate.referralCode,
        status: affiliate.status,
        commissionRate: affiliate.commissionRate,
        commissionType: affiliate.commissionType,
        totalClicks: affiliate.totalClicks,
        totalConversions: affiliate.totalConversions,
        conversionRate: conversionRate.toFixed(2),
        totalEarnings: affiliate.totalEarnings,
        availableBalance: affiliate.availableBalance,
        lifetimeEarnings: affiliate.lifetimeEarnings,
        pendingCommissions: pendingCommissions._sum.amount || 0,
        recentSales,
        recentEarnings: recentEarnings._sum.amount || 0,
        createdAt: affiliate.createdAt,
      },
      referrals: affiliate.referrals,
      commissions: affiliate.commissions,
      recentClicks: affiliate.clicks,
    };
  } catch (error) {
    console.error("Get dashboard error:", error);
    throw new Error("");
  }
}
