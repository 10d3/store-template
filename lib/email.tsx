import { Resend } from "resend";
import type { ReactElement } from "react";
import {
  OrderConfirmationEmail,
  type OrderEmailData,
} from "@/components/emails/order-confirmation-email";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const from = process.env.EMAIL_FROM ?? "Vitanou <noreply@vitanou.com>";

export async function sendEmail({
  to,
  subject,
  react,
}: {
  to: string;
  subject: string;
  react: ReactElement;
}) {
  if (!resend) {
    console.warn(`[email] RESEND_API_KEY is not set; skipped "${subject}" to ${to}`);
    return;
  }

  const { error } = await resend.emails.send({ from, to, subject, react });
  if (error) console.error("[email] send failed:", error);
}

export async function sendOrderConfirmationEmail(data: OrderEmailData) {
  await sendEmail({
    to: data.email,
    subject: `Order ${data.orderNumber} confirmed`,
    react: <OrderConfirmationEmail {...data} />,
  });
}

export async function sendShippingEmail({
  email,
  orderNumber,
  trackingNumber,
  trackingUrl,
  carrier,
}: {
  email: string;
  orderNumber: string;
  trackingNumber?: string | null;
  trackingUrl?: string | null;
  carrier?: string | null;
}) {
  await sendEmail({
    to: email,
    subject: `Order ${orderNumber} has shipped`,
    react: (
      <div style={{ fontFamily: "Arial, sans-serif", lineHeight: 1.6, color: "#111" }}>
        <h1 style={{ fontSize: 22 }}>Your order is on the way</h1>
        <p>
          Order <strong>{orderNumber}</strong> has shipped
          {carrier ? ` with ${carrier}` : ""}.
        </p>
        {trackingNumber && (
          <p>
            Tracking number: <strong>{trackingNumber}</strong>
          </p>
        )}
        {trackingUrl && (
          <p>
            <a href={trackingUrl}>Track your package</a>
          </p>
        )}
      </div>
    ),
  });
}
