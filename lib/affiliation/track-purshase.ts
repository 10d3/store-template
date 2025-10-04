import { cookies, headers } from "next/headers";
import { prisma } from "../prisma";
// import { auth } from "../auth";

// userId, email, orderValue, orderId, orderDetails
export async function trackPurchase({
  userId,
  email,
  orderValue,
  orderId,
  productId,
  productName,
}: {
  userId: string;
  email: string;
  orderValue: number;
  orderId: string;
  productId: string;
  productName: string;
}) {
  try {
    if (!orderValue || orderValue <= 0) {
      throw new Error("Order value must be greater than 0");
    }
    const cookiesStore = await cookies();
    const headersList = await headers();
    // const session = await auth.api.getSession({ headers: headersList });

    const referralCode = cookiesStore.get("referral_code")?.value || "";

    if (!referralCode) {
      // No referral, purchase is successful but not tracked
      throw new Error("No referral code found in cookies");
    }

    // Find affiliate
    const affiliate = await prisma.affiliate.findUnique({
      where: { referralCode },
    });

    if (!affiliate || affiliate.status !== "ACTIVE") {
      throw new Error("Affiliate not active");
    }

    // Prevent self-referral
    if (userId && affiliate.userId === userId) {
      throw new Error("Self-referral not allowed");
    }

    const ipAddress =
      headersList.get("x-forwarded-for") ||
      headersList.get("x-real-ip") ||
      "unknown";

    // Check if referral already exists for this user/email
    let referral;

    if (userId) {
      referral = await prisma.referral.findFirst({
        where: {
          affiliateId: affiliate.id,
          userId,
        },
      });
    } else if (email) {
      referral = await prisma.referral.findFirst({
        where: {
          affiliateId: affiliate.id,
          email,
        },
      });
    }

    // Create or update referral record
    if (!referral) {
      referral = await prisma.referral.create({
        data: {
          affiliateId: affiliate.id,
          userId,
          email,
          status: "COMPLETED",
          orderValue,
          productId,
          productName,
          ipAddress,
          convertedAt: new Date(),
        },
      });
    } else {
      // Update existing referral with new order
      referral = await prisma.referral.update({
        where: { id: referral.id },
        data: {
          orderValue: { increment: orderValue },
          status: "COMPLETED",
          convertedAt: new Date(),
        },
      });
    }

    // Calculate commission
    let commissionAmount = 0;
    if (affiliate.commissionType === "PERCENTAGE") {
      commissionAmount = (orderValue * affiliate.commissionRate) / 100;
    } else {
      commissionAmount = affiliate.commissionRate;
    }

    // Round to 2 decimal places
    commissionAmount = Math.round(commissionAmount * 100) / 100;

    // Create commission record
    const commission = await prisma.commission.create({
      data: {
        affiliateId: affiliate.id,
        referralId: referral.id,
        amount: commissionAmount,
        type: affiliate.commissionType,
        rate: affiliate.commissionRate,
        status: "APPROVED", // Auto-approve or set to PENDING for manual review
        description: `Purchase commission for order ${orderId || "N/A"} - $${orderValue.toFixed(2)}`,
      },
    });

    // Update affiliate stats and earnings
    await prisma.affiliate.update({
      where: { id: affiliate.id },
      data: {
        totalConversions: { increment: 1 },
        totalEarnings: { increment: commissionAmount },
        availableBalance: { increment: commissionAmount },
        lifetimeEarnings: { increment: commissionAmount },
      },
    });

    // Mark click as converted (if exists)
    await prisma.affiliateClick.updateMany({
      where: {
        affiliateId: affiliate.id,
        ipAddress,
        converted: false,
      },
      data: {
        converted: true,
        convertedAt: new Date(),
      },
    });

    return {
      id: referral.id,
      affiliateId: affiliate.id,
      commission: commissionAmount,
      commissionId: commission.id,
    };
  } catch (error) {
    console.error(error);
    throw error;
  }
}
