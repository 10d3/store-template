"use server"

import { ReactElement } from "react";
import { resend } from "../email/order-emails"

export const sendEmail = async ({
    to,
    subject,
    react,
}: {
    to: string;
    subject: string;
    react: ReactElement;
}) => {
    const mail = await resend.emails.send({
        from: "no-reply@vitanou.com",
        to,
        subject,
        react,
    })

    return mail
}