/* eslint-disable @typescript-eslint/no-explicit-any */
// services/email.ts

import { resend } from "./order-emails";

export const emailService = {
  async send(options: {
    to: string;
    data: any,
    subject: string
  }) {
   const result = await resend.emails.send({
      from: 'Nexora <no-reply@mynexora.net>',
      to: options.to,
      subject: options.subject,
      html: options.data
    });
    console.log(result.data)
    console.log(result.error)
    return result
  }
};