"use server"

import { contactFormSchema, type ContactFormValues } from "@/lib/validator"
import ContactFormEmail from "@/components/mails/contact-form-email"
import { ReactElement } from "react"
import { resend } from "../email/order-emails"




export async function submitContactForm(data: ContactFormValues) {
    const result = contactFormSchema.safeParse(data)

    if (!result.success) {
        return {
            success: false,
            message: "Invalid form data",
            errors: result.error.flatten().fieldErrors,
        }
    }

    // Send email to store owner
    try {
        const { data: emailData, error } = await resend.emails.send({
            from: "Vitanou <noreply@vitanou.com>",
            to: ["rickyroselyn72@gmail.com"],
            subject: `New Contact Form Submission: ${data.subject} from ${data.name}`,
            react: ContactFormEmail({
                name: data.name,
                email: data.email,
                subject: data.subject,
                message: data.message,
            }) as ReactElement,
        })

        if (error) {
            console.error("Error sending contact email:", error)
            // We still return success to the user, but log the error
            // Or we could return an error if email sending is critical
        } else {
            console.log("Contact email sent successfully:", emailData?.id)
        }
    } catch (error) {
        console.error("Exception sending contact email:", error)
    }

    return {
        success: true,
        message: "Thank you for your message! We will get back to you soon.",
    }
}
