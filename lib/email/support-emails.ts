"use server";

import { Resend } from "resend";
import { SupportRequestEmail } from "@/components/mails/support-request-email";
import { SupportAlertEmail } from "@/components/mails/support-alert-email";
import { ReactElement } from "react";

const resend = new Resend(process.env.RESEND_API_KEY);

const SUPPORT_ALERT_EMAIL = "rickyroselyn72@gmail.com";

interface SupportEmailData {
    name: string;
    email: string;
    subject: string;
    message: string;
    requestId: string;
}

export async function sendSupportConfirmationEmail(data: SupportEmailData) {
    try {
        const { name, email, subject, message, requestId } = data;

        const submittedAt = new Date().toLocaleString("fr-FR", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });

        const { data: emailData, error } = await resend.emails.send({
            from: "Support Vitanou <support@storerecardo.com>",
            to: [email],
            subject: `Confirmation de votre demande de support - ${requestId}`,
            react: SupportRequestEmail({
                name,
                email,
                subject,
                message,
                requestId,
                submittedAt,
            }) as ReactElement,
        });

        if (error) {
            console.error("Error sending support email:", error);
            throw new Error(`Failed to send email: ${error.message}`);
        }

        console.log("Support confirmation email sent successfully:", emailData?.id);
        return { success: true, emailId: emailData?.id };
    } catch (error) {
        console.error("Error in sendSupportConfirmationEmail:", error);
        throw error;
    }
}

export async function sendSupportAlertEmail(data: SupportEmailData) {
    try {
        const { name, email, subject, message, requestId } = data;

        const submittedAt = new Date().toLocaleString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });

        const { data: emailData, error } = await resend.emails.send({
            from: "Support Vitanou <support@vitanou.com>",
            to: [SUPPORT_ALERT_EMAIL],
            replyTo: email,
            subject: `🔔 New Support Request: ${subject} - ${requestId}`,
            react: SupportAlertEmail({
                name,
                email,
                subject,
                message,
                requestId,
                submittedAt,
            }) as ReactElement,
        });

        if (error) {
            console.error("Error sending support alert email:", error);
            throw new Error(`Failed to send alert email: ${error.message}`);
        }

        console.log("Support alert email sent successfully:", emailData?.id);
        return { success: true, emailId: emailData?.id };
    } catch (error) {
        console.error("Error in sendSupportAlertEmail:", error);
        throw error;
    }
}
