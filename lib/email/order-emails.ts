/* eslint-disable @typescript-eslint/no-explicit-any */
import { Resend } from "resend";
import OrderConfirmationEmail from "@/components/mails/order-confirmation-email";
import OrderCancellationEmail from "@/components/mails/order-cancellation-email";
import RefundEmail from "@/components/mails/refund-email";
import PaymentFailedEmail from "@/components/mails/payment-failed-email";
import DisputeEmail from "@/components/mails/dispute-email";
import TrackingEmail from "@/components/mails/tracking-email";
import OrderUpdateEmail from "@/components/mails/order-update-email";

export const resend = new Resend(process.env.RESEND_API_KEY);

interface OrderEmailData {
  customerEmail: string;
  customerName?: string;
  orderId: string;
  orderTotal: number;
  orderStatus: string;
  orderItems?: any[];
  refundAmount?: number;
  trackingNumber?: string;
  trackingUrl?: string;
  carrier?: string;
}

export async function sendOrderStatusEmail(data: OrderEmailData) {
  try {
    const { customerEmail, orderId, orderStatus } = data;

    let subject = "";
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    let reactComponent: any = null;

    switch (orderStatus) {
      case "completed":
        subject = `Order Confirmation - Order #${orderId}`;
        reactComponent = OrderConfirmationEmail(data);
        break;

      case "cancelled":
        subject = `Order Cancelled - Order #${orderId}`;
        reactComponent = OrderCancellationEmail(data);
        break;

      case "refunded":
        subject = `Refund Processed - Order #${orderId}`;
        reactComponent = RefundEmail(data);
        break;

      case "failed":
        subject = `Payment Failed - Order #${orderId}`;
        reactComponent = PaymentFailedEmail(data);
        break;

      case "disputed":
        subject = `Payment Dispute - Order #${orderId}`;
        reactComponent = DisputeEmail(data);
        break;

      case "shipped":
        subject = `Your Order Has Shipped - Order #${orderId}`;
        reactComponent = TrackingEmail(data);
        break;

      default:
        subject = `Order Update - Order #${orderId}`;
        reactComponent = OrderUpdateEmail(data);
    }

    const { data: emailData, error } = await resend.emails.send({
      from: "Vitanou <noreply@vitanou.com>",
      to: [customerEmail],
      subject,
      react: reactComponent,
    });

    if (error) {
      console.error("Error sending email:", error);
      throw new Error(`Failed to send email: ${error.message}`);
    }

    console.log("Email sent successfully:", emailData?.id);
    return { success: true, emailId: emailData?.id };
  } catch (error) {
    console.error("Error in sendOrderStatusEmail:", error);
    throw error;
  }
}

export async function sendTrackingEmail(data: {
  customerEmail: string;
  customerName?: string;
  orderId: string;
  orderTotal: number;
  trackingNumber: string;
  trackingUrl?: string;
  carrier?: string;
  orderItems?: any[];
}) {
  try {
    const emailData: OrderEmailData = {
      ...data,
      orderStatus: "shipped",
    };

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const reactComponent: any = TrackingEmail(emailData);

    const { data: result, error } = await resend.emails.send({
      from: "Vitanou <noreply@vitanou.com>",
      to: [data.customerEmail],
      subject: `Your Order Has Shipped - Order #${data.orderId}`,
      react: reactComponent,
    });

    if (error) {
      console.error("Error sending tracking email:", error);
      throw new Error(`Failed to send tracking email: ${error.message}`);
    }

    console.log("Tracking email sent successfully:", result?.id);
    return { success: true, emailId: result?.id };
  } catch (error) {
    console.error("Error in sendTrackingEmail:", error);
    throw error;
  }
}
