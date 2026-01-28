"use server";
import { headers } from "next/headers";
import { prisma } from "../prisma";
import { inngest } from "../inngest/client";

export async function trackPurchase({
  userId,
  email,
  orderValue,
  orderId,
  productId,
  productName,
  referralCode,
}: {
  userId: string;
  email: string;
  orderValue: number;
  orderId: string;
  productId: string;
  productName: string;
  referralCode: string | null;
}) {
  if (!orderValue || orderValue <= 0) {
    throw new Error("Order value must be greater than 0");
  }

  if (!referralCode) {
    throw new Error("No referral code found");
  }

  const headersList = await headers();
  const ipAddress =
    headersList.get("x-forwarded-for") ||
    headersList.get("x-real-ip") ||
    "unknown";

  // 1️⃣ Find affiliate
  const affiliate = await prisma.affiliate.findUnique({
    where: { referralCode },
  });

  if (!affiliate || affiliate.status !== "ACTIVE") {
    throw new Error("Affiliate not active");
  }

  // 2️⃣ Prevent self-referral
  if (userId && affiliate.userId === userId) {
    throw new Error("Self-referral not allowed");
  }

  // 3️⃣ Begin transaction
  const result = await prisma.$transaction(async (tx) => {
    // Check existing referral
    let referral = null;
    if (userId) {
      referral = await tx.referral.findFirst({
        where: { affiliateId: affiliate.id, userId },
      });
    } else if (email) {
      referral = await tx.referral.findFirst({
        where: { affiliateId: affiliate.id, email },
      });
    }

    // Create or update referral
    if (!referral) {
      referral = await tx.referral.create({
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
      referral = await tx.referral.update({
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
    commissionAmount = Math.round(commissionAmount * 100) / 100;

    // Create commission record (APPROVED)
    const commission = await tx.commission.create({
      data: {
        affiliateId: affiliate.id,
        referralId: referral.id,
        amount: commissionAmount,
        type: affiliate.commissionType,
        rate: affiliate.commissionRate,
        status: "APPROVED",
        description: `Purchase commission for order ${orderId} - $${orderValue.toFixed(
          2
        )}`,
      },
    });

    // Update affiliate stats
    await tx.affiliate.update({
      where: { id: affiliate.id },
      data: {
        totalConversions: { increment: 1 },
        totalEarnings: { increment: commissionAmount },
        availableBalance: { increment: commissionAmount },
        lifetimeEarnings: { increment: commissionAmount },
      },
    });

    // Mark clicks as converted
    await tx.affiliateClick.updateMany({
      where: {
        affiliateId: affiliate.id,
        ipAddress,
        converted: false,
      },
      data: { converted: true, convertedAt: new Date() },
    });

    return {
      referralId: referral.id,
      affiliateId: affiliate.id,
      commissionAmount,
      commissionId: commission.id,
    };
  });

  // 4️⃣ Optional: emit event outside transaction
  // await inngest.send({
  //   name: "affiliate/commission.earned",
  //   data: {
  //     commissionId: result.commissionId,
  //     affiliateId: result.affiliateId,
  //     amount: result.commissionAmount,
  //   },
  // });

  return result;
}
