/* eslint-disable @typescript-eslint/no-explicit-any */
import Stripe from "stripe";
import { prisma } from "./prisma";
import { trackPurchase } from "./affiliation/track-purshase";

export default async function handleSubscription(payload: Stripe.Event) {
  const { type, data } = payload;

  switch (type) {
    case "invoice.paid":
      break;

    case "checkout.session.completed":
      break;

    case "payment_intent.succeeded":
      await handlePaymentIntentSucceeded(data.object);
      break;

    case "payment_intent.payment_failed":
      await handlePaymentIntentFailed(data.object);
      break;
  }
}

async function handlePaymentIntentSucceeded(paymentIntent: any) {
  console.log("Payment succeeded:", paymentIntent.id);

  try {
    // Track affiliate purchase if referral exists
    if (paymentIntent.metadata?.line_items) {
      const lineItems = JSON.parse(paymentIntent.metadata.line_items);

      // Track each product in the order
      for (const item of lineItems) {
        try {
          // Calculate individual item total
          const itemTotal = (item.price * item.quantity) / 100;

          await trackPurchase({
            userId: paymentIntent.metadata?.user_id || "",
            email: paymentIntent.receipt_email || "",
            orderValue: itemTotal,
            orderId: paymentIntent.id,
            productId: item.id,
            productName: item.name,
          });
        } catch (error) {
          // Log error but continue processing other items
          console.error(
            `Affiliate tracking failed for product ${item.id}:`,
            error
          );
        }
      }
    }

    // Update or create order in database
    await prisma.order.upsert({
      where: { id: paymentIntent.id },
      update: {
        status: "completed",
        updatedAt: new Date(),
        metadata: {
          ...paymentIntent.metadata,
          stripe_status: paymentIntent.status,
          webhook_processed_at: new Date().toISOString(),
        },
      },
      create: {
        id: paymentIntent.id,
        userId: paymentIntent.metadata?.user_id || "unknown",
        total: paymentIntent.amount / 100,
        status: "completed",
        lineItems: paymentIntent.metadata?.line_items
          ? JSON.parse(paymentIntent.metadata.line_items)
          : [],
        shippingAddress: paymentIntent.shipping?.address
          ? JSON.stringify(paymentIntent.shipping.address)
          : null,
        metadata: {
          ...paymentIntent.metadata,
          stripe_status: paymentIntent.status,
          webhook_processed_at: new Date().toISOString(),
        },
        createdAt: new Date(paymentIntent.created * 1000),
        updatedAt: new Date(),
      },
    });

    // Send confirmation email (implement this based on your email service)
    // await sendOrderConfirmationEmail(paymentIntent);
  } catch (error) {
    console.error("Error handling payment success:", error);
  }
}

async function handlePaymentIntentFailed(paymentIntent: any) {
  console.log("Payment failed:", paymentIntent.id);

  try {
    await prisma.order.upsert({
      where: { id: paymentIntent.id },
      update: {
        status: "failed",
        updatedAt: new Date(),
        metadata: {
          ...paymentIntent.metadata,
          stripe_status: paymentIntent.status,
          failure_reason: paymentIntent.last_payment_error?.message,
          webhook_processed_at: new Date().toISOString(),
        },
      },
      create: {
        id: paymentIntent.id,
        userId: paymentIntent.metadata?.user_id || "unknown",
        total: paymentIntent.amount / 100,
        status: "failed",
        lineItems: paymentIntent.metadata?.line_items
          ? JSON.parse(paymentIntent.metadata.line_items)
          : [],
        metadata: {
          ...paymentIntent.metadata,
          stripe_status: paymentIntent.status,
          failure_reason: paymentIntent.last_payment_error?.message,
          webhook_processed_at: new Date().toISOString(),
        },
        createdAt: new Date(paymentIntent.created * 1000),
        updatedAt: new Date(),
      },
    });
  } catch (error) {
    console.error("Error handling payment failure:", error);
  }
}
