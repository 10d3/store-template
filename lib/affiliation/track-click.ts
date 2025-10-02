import { headers } from "next/headers";
import { auth } from "../auth";
import { prisma } from "../prisma";

export async function trackClick({
  referralCode,
  landingPage,
}: {
  referralCode: string;
  landingPage?: string;
}) {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });
    if (!session?.user) {
      throw new Error("User not found");
    }

    const affiliate = await prisma.affiliate.findUnique({
      where: { referralCode },
    });
    if (!affiliate) {
      throw new Error("Affiliate not found");
    }

    // get client info from headers (user-agent, ip, referer)
    const userAgent = headersList.get("user-agent") || "";
    const ipAddress = headersList.get("x-forwarded-for") || "";
    const referer = headersList.get("referer") || "";

    const recentClick = await prisma.affiliateClick.findFirst({
      where: {
        affiliateId: affiliate.id,
        ipAddress,
        createdAt: {
          gte: new Date(Date.now() - 60 * 60 * 1000), // Within last hour
        },
      },
    });

    if (recentClick) {
      return "Click already recorded";
    }

    // Create click record
    const result = await prisma.affiliateClick.create({
      data: {
        affiliateId: affiliate.id,
        ipAddress,
        userAgent,
        referer,
        landingPage: landingPage || "/",
      },
    });

    // Increment total clicks
    await prisma.affiliate.update({
      where: { id: affiliate.id },
      data: { totalClicks: { increment: 1 } },
    });

    return result;
  } catch (error) {
    console.error(error);
    throw error;
  }
}
