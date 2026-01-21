"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { sendNewsletterSubscriptionEmail } from "@/lib/email/newsletter-emails"

export type NewsletterResult = {
    success: boolean
    message: string
}

export async function subscribeToNewsletter(
    email: string,
    source?: string
): Promise<NewsletterResult> {
    try {
        // Check if email already exists
        const existing = await prisma.newsletterSubscription.findUnique({
            where: { email: email.toLowerCase().trim() }
        })

        if (existing) {
            if (existing.status === "ACTIVE") {
                return {
                    success: true,
                    message: "You're already subscribed!"
                }
            }

            // Reactivate if previously unsubscribed
            await prisma.newsletterSubscription.update({
                where: { email: email.toLowerCase().trim() },
                data: { status: "ACTIVE", updatedAt: new Date() }
            })

            // Send welcome email again on reactivation? Optional, but good for "resubscribing to get the coupon" behavior
            await sendNewsletterSubscriptionEmail({ email: email.toLowerCase().trim() });

            return {
                success: true,
                message: "Welcome back! Your subscription has been reactivated."
            }
        }

        // Create new subscription
        await prisma.newsletterSubscription.create({
            data: {
                email: email.toLowerCase().trim(),
                source: source || "website"
            }
        })

        // Send welcome email
        await sendNewsletterSubscriptionEmail({ email: email.toLowerCase().trim() });

        revalidatePath("/")

        return {
            success: true,
            message: "Thanks for subscribing!"
        }
    } catch (error) {
        console.error("Newsletter subscription error:", error)
        return {
            success: false,
            message: "Something went wrong. Please try again."
        }
    }
}

export async function unsubscribeFromNewsletter(
    email: string
): Promise<NewsletterResult> {
    try {
        await prisma.newsletterSubscription.update({
            where: { email: email.toLowerCase().trim() },
            data: { status: "UNSUBSCRIBED" }
        })

        return {
            success: true,
            message: "You've been unsubscribed."
        }
    } catch (error) {
        console.error("Newsletter unsubscribe error:", error)
        return {
            success: false,
            message: "Something went wrong. Please try again."
        }
    }
}
