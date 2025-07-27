/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { getStripeClient } from "@/lib/stripe";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  const body = await request.text();
  const headersList = await headers();
  const sig = headersList.get("stripe-signature");
  const stripe = getStripeClient();

  let event;

  try {
    event = stripe.webhooks.constructEvent(body, sig!, endpointSecret);
  } catch (err: any) {
    console.error(`Webhook signature verification failed:`, err.message);
    return NextResponse.json(
      { error: "Webhook signature verification failed" },
      { status: 400 }
    );
  }

  try {
    // Handle the event
    switch (event.type) {
      case "payment_intent.succeeded":
        await handlePaymentIntentSucceeded(event.data.object);
        break;

      case "payment_intent.payment_failed":
        await handlePaymentIntentFailed(event.data.object);
        break;

      case "payment_intent.canceled":
        await handlePaymentIntentCanceled(event.data.object);
        break;

      case "charge.dispute.created":
        await handleChargeDisputeCreated(event.data.object);
        break;

      case "invoice.payment_succeeded":
        await handleInvoicePaymentSucceeded(event.data.object);
        break;

      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
        await handleSubscriptionChange(event.data.object, event.type);
        break;

      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}

async function handlePaymentIntentSucceeded(paymentIntent: any) {
  console.log("Payment succeeded:", paymentIntent.id);

  try {
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

async function handlePaymentIntentCanceled(paymentIntent: any) {
  console.log("Payment canceled:", paymentIntent.id);

  try {
    await prisma.order.upsert({
      where: { id: paymentIntent.id },
      update: {
        status: "cancelled",
        updatedAt: new Date(),
        metadata: {
          ...paymentIntent.metadata,
          stripe_status: paymentIntent.status,
          cancellation_reason: paymentIntent.cancellation_reason,
          webhook_processed_at: new Date().toISOString(),
        },
      },
      create: {
        id: paymentIntent.id,
        userId: paymentIntent.metadata?.user_id || "unknown",
        total: paymentIntent.amount / 100,
        status: "cancelled",
        lineItems: paymentIntent.metadata?.line_items
          ? JSON.parse(paymentIntent.metadata.line_items)
          : [],
        metadata: {
          ...paymentIntent.metadata,
          stripe_status: paymentIntent.status,
          cancellation_reason: paymentIntent.cancellation_reason,
          webhook_processed_at: new Date().toISOString(),
        },
        createdAt: new Date(paymentIntent.created * 1000),
        updatedAt: new Date(),
      },
    });
  } catch (error) {
    console.error("Error handling payment cancellation:", error);
  }
}

async function handleChargeDisputeCreated(dispute: any) {
  console.log("Dispute created:", dispute.id);

  try {
    const stripe = getStripeClient();
    // Update order status to indicate dispute
    const charge = await stripe.charges.retrieve(dispute.charge);
    if (charge.payment_intent) {
      await prisma.order.update({
        where: { id: charge.payment_intent as string },
        data: {
          status: "disputed",
          updatedAt: new Date(),
          metadata: {
            dispute_id: dispute.id,
            dispute_reason: dispute.reason,
            dispute_status: dispute.status,
            webhook_processed_at: new Date().toISOString(),
          },
        },
      });
    }
  } catch (error) {
    console.error("Error handling dispute:", error);
  }
}

async function handleInvoicePaymentSucceeded(invoice: any) {
  console.log("Invoice payment succeeded:", invoice.id);
  // Handle subscription payments if you have subscriptions
}

async function handleSubscriptionChange(subscription: any, eventType: string) {
  console.log("Subscription change:", eventType, subscription.id);
  // Handle subscription changes if you have subscriptions
}
