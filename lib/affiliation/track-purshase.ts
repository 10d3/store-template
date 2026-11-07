import { headers } from "next/headers";
import { prisma } from "../prisma";
import { inngest } from "../inngest/client";

// NOTE: intentionally NOT a "use server" module. This function mutates
// money-bearing state (balances/earnings) and must never be invocable from
// the client. It is only called from trusted server/webhook code
// (lib/subscription.ts), and orderValue is always sourced from the stored
// Order total — never from caller-supplied prices.

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

  // Normalize empty-string ids (guest flows send "") to null so the
  // self-referral guard and lookups behave identically for guests.
  const uid = userId || null;

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

  // 2️⃣ Prevent self-referral (guard on normalized uid, not raw userId)
  if (uid && affiliate.userId === uid) {
    throw new Error("Self-referral not allowed");
  }

  // 3️⃣ Begin transaction
  const result = await prisma.$transaction(async (tx) => {
    // ⚠️ Idempotency guard FIRST: Stripe redelivers webhook events and every
    // delivery used to mint a fresh commission. The Commission model has no
    // orderId/productId columns, so the linkage lives in the description
    // prefix we control below ("Purchase commission for order <id> - product
    // <id>"). Skip creation when a commission for this order+product exists.
    const existingCommission = await tx.commission.findFirst({
      where: {
        affiliateId: affiliate.id,
        description: {
          startsWith: `Purchase commission for order ${orderId} - product ${productId}`,
        },
      },
    });

    if (existingCommission) {
      return {
        referralId: existingCommission.referralId,
        affiliateId: affiliate.id,
        commissionAmount: 0,
        commissionId: existingCommission.id,
        duplicate: true,
      };
    }

    // Check existing referral
    let referral = null;
    if (uid) {
      referral = await tx.referral.findFirst({
        where: { affiliateId: affiliate.id, userId: uid },
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
          userId: uid,
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

    // Create commission record (APPROVED). The description embeds the
    // orderId + productId — it is the dedup key consumed above and by the
    // refund clawback in lib/subscription.ts.
    const commission = await tx.commission.create({
      data: {
        affiliateId: affiliate.id,
        referralId: referral.id,
        amount: commissionAmount,
        type: affiliate.commissionType,
        rate: affiliate.commissionRate,
        status: "APPROVED",
        description: `Purchase commission for order ${orderId} - product ${productId} - $${orderValue.toFixed(
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
      duplicate: false,
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
