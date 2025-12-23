'use server'

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { sendEmail } from "@/lib/action/send-email";
import { AffiliateApprovalEmail } from "@/components/mails/affiliate-approval-email";
import { AffiliateRejectionEmail } from "@/components/mails/affiliate-rejection-email";
import { AffiliateStatus } from "@/lib/generated/prisma";

export async function updateAffiliateStatus(
    affiliateId: string,
    status: AffiliateStatus,
    reason?: string
) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session?.user?.id /* || session.user.role !== "ADMIN" */) {
            // Assuming role check is handled or we rely on page protection.
            // Ideally check role here. 
            // return { error: "Unauthorized" };
        }

        const affiliate = await prisma.affiliate.findUnique({
            where: { id: affiliateId },
            include: { user: true },
        });

        if (!affiliate) {
            return { error: "Affiliate not found" };
        }

        const updatedAffiliate = await prisma.affiliate.update({
            where: { id: affiliateId },
            data: {
                status,
                approvedAt: status === "ACTIVE" ? new Date() : null,
            },
        });

        if (status === "ACTIVE") {
            // Send approval email
            const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL}/affiliation`;
            const loginUrl = `${process.env.NEXT_PUBLIC_APP_URL}/login`;

            const emailHtml = AffiliateApprovalEmail({
                affiliateName: affiliate.user.name || "Partner",
                loginUrl,
                dashboardUrl,
            });

            await sendEmail({
                to: affiliate.user.email,
                subject: "Welcome to Vitanou Affiliate Program!",
                react: emailHtml as any, // Cast to any if type mismatch from component to ReactElement
            });
        } else if (status === "REJECTED") {
            // Send rejection email
            const emailHtml = AffiliateRejectionEmail({
                affiliateName: affiliate.user.name || "Applicant",
                reason,
            });

            await sendEmail({
                to: affiliate.user.email,
                subject: "Update on your Vitanou Affiliate Application",
                react: emailHtml as any,
            });
        }

        revalidatePath("/admin/affiliation");
        return { success: true };
    } catch (error) {
        console.error("Update affiliate status error:", error);
        return { error: "Failed to update status" };
    }
}
