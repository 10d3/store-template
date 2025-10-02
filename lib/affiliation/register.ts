import { headers } from "next/headers";
import { auth } from "../auth";
import { generateReferralCode } from "../utils";
import { prisma } from "../prisma";
import { PaymentMethod } from "../generated/prisma";

interface RegisterAffiliateRequest {
  stripeId?: string;
  paypalEmail?: string;
  paymentMethod?: PaymentMethod;
  notes?: string;
}

export async function registerAffiliate({
  stripeId,
  paypalEmail,
  paymentMethod,
  notes,
}: RegisterAffiliateRequest) {
  console.log(stripeId);
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      throw new Error("User not found");
    }

    const existingAffiliate = await prisma.affiliate.findUnique({
      where: { userId: session.user.id },
    });
    if (existingAffiliate) {
      throw new Error("Affiliate already registered");
    }

    let referralCode = generateReferralCode();
    let isUnique = false;

    while (!isUnique) {
      const existing = await prisma.affiliate.findUnique({
        where: { referralCode },
      });
      if (!existing) {
        isUnique = true;
      } else {
        referralCode = generateReferralCode();
      }
    }

    const affiliate = await prisma.affiliate.create({
      data: {
        userId: session.user.id,
        referralCode,
        paypalEmail,
        paymentMethod: paymentMethod || "PAYPAL",
        status: "PENDING", // Requires admin approval
        commissionRate: 10.0, // 10% default
        commissionType: "PERCENTAGE",
        notes,
      },
      include: {
        user: {
          select: {
            email: true,
            name: true,
          },
        },
      },
    });

    return affiliate;
  } catch (error) {
    console.error(error);
    throw error;
  }
}
