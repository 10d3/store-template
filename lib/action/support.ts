"use server";

import { prisma } from "@/lib/prisma";
import { sendSupportConfirmationEmail, sendSupportAlertEmail } from "@/lib/email/support-emails";

interface SupportFormData {
    name: string;
    email: string;
    subject: string;
    message: string;
}

export async function submitSupportRequest(data: SupportFormData) {
    try {
        const { name, email, subject, message } = data;

        // Validate required fields
        if (!name || !email || !subject || !message) {
            return { success: false, error: "All fields are required" };
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return { success: false, error: "Invalid email format" };
        }

        // Create support request in database
        const supportRequest = await prisma.supportRequest.create({
            data: {
                name,
                email,
                subject,
                message,
            },
        });

        // Send confirmation email to the user and alert email to support team
        const emailData = {
            name,
            email,
            subject,
            message,
            requestId: supportRequest.id,
        };

        try {
            await sendSupportConfirmationEmail(emailData);
        } catch (emailError) {
            console.error("Failed to send support confirmation email:", emailError);
            // Don't fail the request if email fails, the support request is already saved
        }

        try {
            await sendSupportAlertEmail(emailData);
        } catch (emailError) {
            console.error("Failed to send support alert email:", emailError);
            // Don't fail the request if alert email fails
        }

        return {
            success: true,
            message: "Support request submitted successfully",
            id: supportRequest.id,
        };
    } catch (error) {
        console.error("Error creating support request:", error);
        return { success: false, error: "Failed to submit support request" };
    }
}
