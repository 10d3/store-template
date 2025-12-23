/* eslint-disable @typescript-eslint/no-explicit-any */
// services/email.ts

import { resend } from "./order-emails";

export const emailService = {
  async send(options: {
    to: string;
    data?: any;
    react?: any;
    subject: string
  }) {
    const payload: any = {
      from: 'Nexora <no-reply@mynexora.net>',
      to: options.to,
      subject: options.subject,
    };

    if (options.react) {
      payload.react = options.react;
    } else {
      payload.html = options.data;
    }

    const result = await resend.emails.send(payload);
    console.log(result.data)
    console.log(result.error)
    return result
  }
};