/* eslint-disable @typescript-eslint/no-explicit-any */
import Stripe from "stripe";
import { prisma } from "./prisma";
import { trackPurchase } from "./affiliation/track-purshase";
import {
  syncProductToDatabase,
  deleteProductFromDatabase,
  syncPriceToDatabase,
  deletePriceFromDatabase,
} from "./product/product-sync";
import { sendOrderStatusEmail, sendOwnerOrderNotification } from "./email/order-emails";
import { generateOrderId } from "./order-id";

// ── Webhook deduplication ────────────────────────────────────────
// CRUD operations (createPack, updatePack, etc.) sync products to the
// database directly. Those same Stripe mutations also fire webhooks.
// This set tracks product/price IDs that were just synced by CRUD so the
// webhook handler can skip the redundant second sync.
const recentlySyncedIds = new Set<string>();

export function markAsSynced(id: string) {
  recentlySyncedIds.add(id);
  setTimeout(() => recentlySyncedIds.delete(id), 10_000); // 10 s TTL
}

export default async function handleSubscription(payload: Stripe.Event) {
  const { type, data } = payload;

  switch (type) {
    // ── Checkout ──────────────────────────────────────────────────
    case "checkout.session.completed":
      await handleCheckoutCompletedSession(data.object as Stripe.Checkout.Session);
      break;

    case "checkout.session.expired":
      // Session expired without payment — useful for cart recovery emails
      await handleCheckoutExpired(data.object as Stripe.Checkout.Session);
      break;

    // ── Payment Intents ───────────────────────────────────────────
    case "payment_intent.succeeded":
      // Fires for Payment Intents created outside of Checkout Sessions
      // (e.g. direct API calls, mobile SDKs). Keep this active so orders
      // created this way still trigger notifications.
      await handlePaymentIntentSucceeded(data.object as Stripe.PaymentIntent);
      break;

    case "payment_intent.payment_failed":
      await handlePaymentIntentFailed(data.object as Stripe.PaymentIntent);
      break;

    case "payment_intent.canceled":
      await handlePaymentIntentCanceled(data.object as Stripe.PaymentIntent);
      break;

    // ── Charges ───────────────────────────────────────────────────
    case "charge.refunded":
      // Fired when a refund is issued — update order status accordingly
      await handleChargeRefunded(data.object as Stripe.Charge);
      break;

    case "charge.dispute.created":
      // A customer opened a dispute — flag the order immediately
      await handleDisputeCreated(data.object as Stripe.Dispute);
      break;

    // ── Invoices (subscriptions) ───────────────────────────────────
    case "invoice.paid":
      // Subscription renewal succeeded
      await handleInvoicePaid(data.object as Stripe.Invoice);
      break;

    case "invoice.payment_failed":
      // Subscription renewal failed — notify customer
      await handleInvoicePaymentFailed(data.object as Stripe.Invoice);
      break;

    // ── Transfers / Affiliates ────────────────────────────────────
    case "transfer.created":
      await handleTransferCreated(data.object as Stripe.Transfer);
      break;

    // ── Product / Price sync ──────────────────────────────────────
    case "product.created":
    case "product.updated":
      if (recentlySyncedIds.has((data.object as Stripe.Product).id)) break;
      await syncProductToDatabase(data.object as Stripe.Product);
      break;

    case "product.deleted":
      await deleteProductFromDatabase((data.object as Stripe.Product).id);
      break;

    case "price.created":
    case "price.updated":
      if (recentlySyncedIds.has((data.object as Stripe.Price).id)) break;
      await syncPriceToDatabase(data.object as Stripe.Price);
      break;

    case "price.deleted":
      await deletePriceFromDatabase((data.object as Stripe.Price).id);
      break;

    default:
      // Log unhandled events during development so nothing goes unnoticed
      console.log(`[webhook] unhandled event type: ${type}`);
  }
}

// ─────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────

/**
 * Sends an email and swallows errors so a failed email never blocks
 * other work (DB writes, other emails, etc.).
 */
async function trySendEmail(label: string, fn: () => Promise<unknown>) {
  try {
    await fn();
  } catch (err) {
    // Email failure is logged but never fatal — the order is already saved.
    console.error(`[email] ${label} failed:`, err);
  }
}

function parseLineItems(raw: string | null | undefined): any[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch {
    return [];
  }
}

function buildOrderItems(lineItems: any[]): { name: string; quantity: number; price: number; image?: string }[] {
  return lineItems.map((item) => ({
    name:
      item.name ??
      item.price_data?.product_data?.name ??
      item.description ??
      item.title ??
      "Product",
    quantity: item.quantity ?? 1,
    price: item.price_data?.unit_amount
      ? item.price_data.unit_amount / 100
      : item.amount_total
        ? item.amount_total / (item.quantity ?? 1) / 100
        : 0,
    image:
      item.image ??
      item.price_data?.product_data?.images?.[0] ??
      item.images?.[0],
  }));
}

// ─────────────────────────────────────────────────────────────────
// Checkout Session
// ─────────────────────────────────────────────────────────────────

async function handleCheckoutCompletedSession(data: Stripe.Checkout.Session) {
  console.log("[webhook] checkout.session.completed:", data.id);

  try {
    // ── Affiliate tracking ──────────────────────────────────────
    const lineItemsRaw = parseLineItems(data.metadata?.line_items);
    for (const item of lineItemsRaw) {
      try {
        const itemTotal =
          ((item.price_data?.unit_amount ?? 0) * (item.quantity ?? 0)) / 100;
        await trackPurchase({
          userId: data.metadata?.userId ?? "",
          email: data.customer_details?.email ?? "",
          orderValue: itemTotal,
          orderId: data.id,
          productId: item.price_data?.product_data?.id as string,
          productName: item.price_data?.product_data?.name as string,
          referralCode: data.metadata?.referralCode ?? null,
        });
      } catch (err) {
        console.error(`[affiliate] tracking failed for item ${item.price_data?.product_data?.id}:`, err);
      }
    }

    // ── Upsert order ────────────────────────────────────────────
    const shippingAddress = buildShippingAddress(
      data.collected_information?.shipping_details
    );

    const order = await prisma.order.upsert({
      where: { id: data.id },
      update: {
        status: "completed",
        updatedAt: new Date(),
        customerEmail: data.customer_details?.email ?? data.metadata?.customerEmail ?? null,
        customerName: data.customer_details?.name ?? data.metadata?.customerName ?? null,
        shippingAddress,
        metadata: {
          ...data.metadata,
          stripe_status: data.status,
          webhook_processed_at: new Date().toISOString(),
        },
      },
      create: {
        id: data.id,
        orderNumber: generateOrderId(),
        userId: (data.metadata?.userId as string) ?? null,
        customerEmail: data.customer_details?.email ?? data.metadata?.customerEmail ?? null,
        customerName: data.customer_details?.name ?? data.metadata?.customerName ?? null,
        total: data.amount_total ? data.amount_total / 100 : 0,
        status: "completed",
        lineItems: lineItemsRaw,
        shippingAddress,
        metadata: {
          ...data.metadata,
          stripe_status: data.status,
          webhook_processed_at: new Date().toISOString(),
        },
        createdAt: new Date(data.created * 1000),
        updatedAt: new Date(),
      },
    });

    const orderItems = buildOrderItems(lineItemsRaw);
    const orderTotal = data.amount_total ? data.amount_total / 100 : 0;
    const orderId = order.orderNumber.toString();

    // ── Emails — each wrapped independently ─────────────────────
    // BUG FIX: previously both were in a single try/catch, so a failure
    // in the customer email silently swallowed the owner notification.
    await trySendEmail("customer confirmation", () =>
      sendOrderStatusEmail({
        customerEmail: data.customer_details?.email ?? "",
        customerName: data.customer_details?.name ?? "Customer",
        orderId,
        orderTotal,
        orderStatus: "completed",
        orderItems,
      })
    );

    await trySendEmail("owner notification", () =>
      sendOwnerOrderNotification({
        orderId,
        customerName: data.customer_details?.name ?? "Customer",
        customerEmail: data.customer_details?.email ?? "",
        orderTotal,
        orderItems,
      })
    );
  } catch (error) {
    console.error("[webhook] handleCheckoutCompletedSession error:", error);
  }
}

async function handleCheckoutExpired(data: Stripe.Checkout.Session) {
  console.log("[webhook] checkout.session.expired:", data.id);
  // Optional: mark abandoned cart, send recovery email, etc.
  try {
    await prisma.order.updateMany({
      where: { id: data.id },
      data: { status: "abandoned", updatedAt: new Date() },
    });
  } catch (err) {
    console.error("[webhook] handleCheckoutExpired error:", err);
  }
}

// ─────────────────────────────────────────────────────────────────
// Payment Intents
// ─────────────────────────────────────────────────────────────────

async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  console.log("[webhook] payment_intent.succeeded:", paymentIntent.id);

  // Skip if this PI belongs to a Checkout Session — that session's
  // `checkout.session.completed` event handles everything already.
  if (paymentIntent.metadata?.checkout_session_id) return;

  try {
    const lineItemsRaw = parseLineItems(paymentIntent.metadata?.line_items);

    const user = await prisma.user.findUnique({
      where: { stripeCustomerId: paymentIntent.customer as string },
    });

    const order = await prisma.order.upsert({
      where: { id: paymentIntent.id },
      update: {
        status: "completed",
        updatedAt: new Date(),
        customerEmail: paymentIntent.receipt_email ?? paymentIntent.metadata?.customerEmail ?? null,
        customerName: paymentIntent.metadata?.customerName ?? null,
        metadata: {
          ...paymentIntent.metadata,
          stripe_status: paymentIntent.status,
          webhook_processed_at: new Date().toISOString(),
        },
      },
      create: {
        id: paymentIntent.id,
        orderNumber: generateOrderId(),
        userId: user?.id ?? paymentIntent.metadata?.user_id ?? null,
        customerEmail: paymentIntent.receipt_email ?? paymentIntent.metadata?.customerEmail ?? null,
        customerName: paymentIntent.metadata?.customerName ?? null,
        total: paymentIntent.amount / 100,
        status: "completed",
        lineItems: lineItemsRaw,
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

    const orderItems = buildOrderItems(lineItemsRaw);
    const orderTotal = paymentIntent.amount / 100;
    const orderId = order.orderNumber.toString();

    await trySendEmail("customer confirmation", () =>
      sendOrderStatusEmail({
        customerEmail: paymentIntent.receipt_email ?? "",
        customerName: paymentIntent.metadata?.customerName ?? "Customer",
        orderId,
        orderTotal,
        orderStatus: "completed",
        orderItems,
      })
    );

    await trySendEmail("owner notification", () =>
      sendOwnerOrderNotification({
        orderId,
        customerName: paymentIntent.metadata?.customerName ?? "Customer",
        customerEmail: paymentIntent.receipt_email ?? "",
        orderTotal,
        orderItems,
      })
    );
  } catch (error) {
    console.error("[webhook] handlePaymentIntentSucceeded error:", error);
  }
}

async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  console.log("[webhook] payment_intent.payment_failed:", paymentIntent.id);

  try {
    await prisma.order.upsert({
      where: { id: paymentIntent.id },
      update: {
        status: "failed",
        updatedAt: new Date(),
        customerEmail: paymentIntent.receipt_email ?? paymentIntent.metadata?.customerEmail ?? null,
        customerName: paymentIntent.metadata?.customerName ?? null,
        metadata: {
          ...paymentIntent.metadata,
          stripe_status: paymentIntent.status,
          failure_reason: paymentIntent.last_payment_error?.message,
          webhook_processed_at: new Date().toISOString(),
        },
      },
      create: {
        id: paymentIntent.id,
        orderNumber: generateOrderId(),
        userId: paymentIntent.metadata?.user_id ?? null,
        customerEmail: paymentIntent.receipt_email ?? paymentIntent.metadata?.customerEmail ?? null,
        customerName: paymentIntent.metadata?.customerName ?? null,
        total: paymentIntent.amount / 100,
        status: "failed",
        lineItems: parseLineItems(paymentIntent.metadata?.line_items),
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

    // Optionally notify customer of the failure
    await trySendEmail("payment failed notice", () =>
      sendOrderStatusEmail({
        customerEmail: paymentIntent.receipt_email ?? "",
        customerName: paymentIntent.metadata?.customerName ?? "Customer",
        orderId: paymentIntent.id,
        orderTotal: paymentIntent.amount / 100,
        orderStatus: "failed",
        orderItems: [],
      })
    );
  } catch (error) {
    console.error("[webhook] handlePaymentIntentFailed error:", error);
  }
}

async function handlePaymentIntentCanceled(paymentIntent: Stripe.PaymentIntent) {
  console.log("[webhook] payment_intent.canceled:", paymentIntent.id);
  try {
    await prisma.order.updateMany({
      where: { id: paymentIntent.id },
      data: { status: "cancelled", updatedAt: new Date() },
    });
  } catch (error) {
    console.error("[webhook] handlePaymentIntentCanceled error:", error);
  }
}

// ─────────────────────────────────────────────────────────────────
// Charges
// ─────────────────────────────────────────────────────────────────

async function handleChargeRefunded(charge: Stripe.Charge) {
  console.log("[webhook] charge.refunded:", charge.id);
  try {
    const paymentIntentId = charge.payment_intent as string | null;
    if (!paymentIntentId) return;

    await prisma.order.updateMany({
      where: { id: paymentIntentId },
      data: {
        status: "refunded",
        updatedAt: new Date(),
      },
    });
  } catch (error) {
    console.error("[webhook] handleChargeRefunded error:", error);
  }
}

async function handleDisputeCreated(dispute: Stripe.Dispute) {
  console.log("[webhook] charge.dispute.created:", dispute.id);
  try {
    const paymentIntentId = dispute.payment_intent as string | null;
    if (!paymentIntentId) return;

    await prisma.order.updateMany({
      where: { id: paymentIntentId },
      data: {
        status: "disputed",
        updatedAt: new Date(),
      },
    });
  } catch (error) {
    console.error("[webhook] handleDisputeCreated error:", error);
  }
}

// ─────────────────────────────────────────────────────────────────
// Invoices (subscriptions)
// ─────────────────────────────────────────────────────────────────

async function handleInvoicePaid(invoice: Stripe.Invoice) {
  console.log("[webhook] invoice.paid:", invoice.id);
  // Add subscription renewal logic here if needed
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  console.log("[webhook] invoice.payment_failed:", invoice.id);
  // Notify customer of failed renewal, update subscription status, etc.
}

// ─────────────────────────────────────────────────────────────────
// Transfers / Affiliates
// ─────────────────────────────────────────────────────────────────

async function handleTransferCreated(transfer: Stripe.Transfer) {
  console.log("[webhook] transfer.created:", transfer.id);
  try {
    const result = await prisma.payout.create({
      data: {
        affiliateId: transfer.metadata.affiliateId,
        amount: transfer.amount / 100,
        method: "STRIPE",
        status: "COMPLETED",
        transactionId: transfer.id,
        notes: transfer.description,
      },
    });

    await prisma.affiliate.update({
      where: { id: result.affiliateId },
      data: {
        availableBalance: { decrement: result.amount },
      },
    });
  } catch (error) {
    console.error("[webhook] handleTransferCreated error:", error);
  }
}

// ─────────────────────────────────────────────────────────────────
// Shared utilities
// ─────────────────────────────────────────────────────────────────

function buildShippingAddress(
  shippingDetails: Stripe.Checkout.Session.CollectedInformation.ShippingDetails | null | undefined
): string | null {
  if (!shippingDetails?.address) return null;
  return JSON.stringify({
    line1: shippingDetails.address.line1,
    line2: shippingDetails.address.line2,
    city: shippingDetails.address.city,
    state: shippingDetails.address.state,
    postal_code: shippingDetails.address.postal_code,
    country: shippingDetails.address.country,
    name: shippingDetails.name,
  });
}
