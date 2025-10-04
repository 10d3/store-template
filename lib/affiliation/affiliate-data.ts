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

    // Get total sold products
    const totalSoldProducts = await prisma.referral.aggregate({
      where: {
        affiliateId: affiliate.id,
        status: "COMPLETED",
      },
      _sum: {
        quantity: true,
      },
    });

    // Get top selling product
    const topProduct = await prisma.referral.groupBy({
      by: ["productId", "productName"],
      where: {
        affiliateId: affiliate.id,
        status: "COMPLETED",
      },
      _sum: {
        quantity: true,
      },
      orderBy: {
        _sum: {
          quantity: "desc",
        },
      },
      take: 1,
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
        totalSoldProducts: totalSoldProducts._sum.quantity || 0,
        topProduct:
          topProduct.length > 0
            ? {
                productId: topProduct[0].productId,
                productName: topProduct[0].productName,
                quantity: topProduct[0]._sum.quantity || 0,
              }
            : null,
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

export async function getRefferalCode() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }

    const affiliate = await prisma.affiliate.findUnique({
      where: { userId: session.user.id },
    });

    if (!affiliate) {
      throw new Error("Affiliate not found");
    }

    console.log("affiliate", affiliate);
    return affiliate.referralCode;
  } catch (error) {
    console.error("Get referral code error:", error);
    throw new Error("");
  }
}
