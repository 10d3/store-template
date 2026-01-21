import { Resend } from "resend";
import { NewsletterSubscriptionEmail } from "@/components/mails/newsletter-subscription-email";

const resend = new Resend(process.env.RESEND_API_KEY);

interface NewsletterEmailData {
    email: string;
    customerName?: string;
    couponCode?: string;
    discountValue?: string;
}

export async function sendNewsletterSubscriptionEmail(data: NewsletterEmailData) {
    try {
        const { email, customerName, couponCode, discountValue } = data;

        const { data: emailData, error } = await resend.emails.send({
            from: "Vitanou <noreply@vitanou.com>",
            to: [email],
            subject: "Welcome to Vitanou! Here's your discount code",
            react: NewsletterSubscriptionEmail({
                customerName,
                couponCode,
                discountValue,
            }) as React.ReactElement,
        });

        if (error) {
            console.error("Error sending newsletter email:", error);
            throw new Error(`Failed to send newsletter email: ${error.message}`);
        }

        console.log("Newsletter email sent successfully:", emailData?.id);
        return { success: true, emailId: emailData?.id };
    } catch (error) {
        console.error("Error in sendNewsletterSubscriptionEmail:", error);
        // Don't throw here to prevent breaking the subscription flow if email fails
        return { success: false, error };
    }
}
