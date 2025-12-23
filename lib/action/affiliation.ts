'use server'

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";

const joinAffiliateSchema = z.object({
    tiktok: z.string().optional().or(z.literal("")),
    instagram: z.string().optional().or(z.literal("")),
    twitter: z.string().optional().or(z.literal("")),
    youtube: z.string().optional().or(z.literal("")),
});

export type JoinAffiliateState = {
    error?: string;
    success?: boolean;
};

export async function joinAffiliateProgram(
    prevState: JoinAffiliateState,
    formData: FormData
): Promise<JoinAffiliateState> {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session?.user?.id) {
            return { error: "You must be logged in to join the affiliate program." };
        }

        const userId = session.user.id;

        // Check if already an affiliate
        const existingAffiliate = await prisma.affiliate.findUnique({
            where: { userId },
        });

        if (existingAffiliate) {
            return { error: "You have already applied or are already an affiliate." };
        }

        const rawData = {
            tiktok: formData.get("tiktok") as string,
            instagram: formData.get("instagram") as string,
            twitter: formData.get("twitter") as string,
            youtube: formData.get("youtube") as string,
        };

        const validatedData = joinAffiliateSchema.safeParse(rawData);

        if (!validatedData.success) {
            return { error: "Invalid data provided." };
        }

        // Generate a default referral code
        // Simplest approach: use first part of email + random string or user name if available
        // Here we'll try to use the user's name or email + random suffix

        // We need to fetch the user to get their name/email for code generation
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) return { error: "User not found" };

        const baseCode = (user.name || user.email.split("@")[0] || "affiliate").replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
        const randomSuffix = Math.floor(Math.random() * 10000).toString().padStart(4, "0");
        const referralCode = `${baseCode}-${randomSuffix}`;

        await prisma.affiliate.create({
            data: {
                userId,
                referralCode,
                status: "PENDING",
                tiktok: validatedData.data.tiktok || null,
                instagram: validatedData.data.instagram || null,
                twitter: validatedData.data.twitter || null,
                youtube: validatedData.data.youtube || null,
                commissionRate: 10.0, // Default 10%
                commissionType: "PERCENTAGE",
            },
        });

        revalidatePath("/affiliate-program");
        return { success: true };
    } catch (error) {
        console.error("Join affiliate error:", error);
        return { error: "Something went wrong. Please try again." };
    }
}
