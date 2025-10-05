/* eslint-disable @typescript-eslint/no-explicit-any */
// services/email.ts

import { resend } from "./order-emails";

export const emailService = {
  async send(options: {
    to: string;
    data: any,
    subject: string
  }) {
    return await resend.emails.send({
      from: 'noreply@votreapp.com',
      to: options.to,
      subject: options.subject,
      html: options.data
    });
  }
};