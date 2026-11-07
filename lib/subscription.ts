/* eslint-disable @typescript-eslint/no-explicit-any */
import Stripe from "stripe";
import { prisma } from "./prisma";
import { trackPurchase } from "./affiliation/track-purshase";
import { refund } from "./affiliation/refund";
import { stripeClient } from "./stripe";
import {
  syncProductToDatabase,
  deleteProductFromDatabase,
  syncPriceToDatabase,
  deletePriceFromDatabase,
} from "./product/product-sync";
import { sendOrderStatusEmail, sendOwnerOrderNotification } from "./email/order-emails";
import { generateOrderId } from "./order-id";
import { inngest } from "./inngest/client";

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

interface OrderLineItemRow {
  orderId: string;
  variantId: string | null;
  productName: string;
  variantTitle: string;
  sku: string | null;
  image: string | null;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
}

/**
 * Persists OrderLineItem rows for an order. Variant FKs are sanitized against
 * the DB so a stale/unknown variant id can never break the webhook (variantId
 * is nullable). Idempotent: existing rows for the order are replaced.
 */
async function persistOrderLineItems(orderId: string, rows: OrderLineItemRow[]) {
  if (rows.length === 0) return;

  const variantIds = Array.from(
    new Set(rows.map((r) => r.variantId).filter((id): id is string => !!id))
  );
  const existing = variantIds.length
    ? await prisma.productVariant.findMany({
        where: { id: { in: variantIds } },
        select: { id: true },
      })
    : [];
  const validIds = new Set(existing.map((v) => v.id));

  const data = rows.map((r) => ({
    ...r,
    variantId: r.variantId && validIds.has(r.variantId) ? r.variantId : null,
  }));

  await prisma.orderLineItem.deleteMany({ where: { orderId } });
  await prisma.orderLineItem.createMany({ data });
}

// ─────────────────────────────────────────────────────────────────
// Checkout Session
// ─────────────────────────────────────────────────────────────────

async function handleCheckoutCompletedSession(data: Stripe.Checkout.Session) {
  console.log("[webhook] checkout.session.completed:", data.id);

  try {
    const lineItemsRaw = parseLineItems(data.metadata?.line_items);

    // SECURITY: order + total come from trusted Stripe amounts only.
    // Client-controlled metadata prices must never drive money math.
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
        userId: (data.metadata?.userId as string) || null,
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

    // ── Persist real OrderLineItem rows ─────────────────────────
    // Read variant identity back from the expanded Stripe product metadata
    // (written by checkout-session.ts). FKs are sanitized in the helper.
    const stripeLineItems = await stripeClient.checkout.sessions.listLineItems(
      data.id,
      { limit: 100, expand: ["data.price.product"] }
    );

    const orderLineItemRows: OrderLineItemRow[] = stripeLineItems.data.map((li) => {
      const product = li.price?.product;
      const meta =
        (product && typeof product === "object"
          ? (product as Stripe.Product).metadata
          : undefined) ?? {};
      const quantity = li.quantity ?? 1;
      const unitPrice =
        li.price?.unit_amount ??
        Math.round((li.amount_subtotal ?? 0) / (li.quantity || 1));
      return {
        orderId: order.id,
        variantId: typeof meta.variantId === "string" ? meta.variantId : null,
        productName:
          li.description ??
          (typeof meta.name === "string" ? meta.name : undefined) ??
          "Product",
        variantTitle:
          (typeof meta.variantTitle === "string" && meta.variantTitle) || "Default",
        sku: null,
        image: (typeof meta.image === "string" && meta.image) || null,
        unitPrice,
        quantity,
        totalPrice: unitPrice * quantity,
      };
    });

    await persistOrderLineItems(order.id, orderLineItemRows);

    // ── Affiliate tracking (AFTER the order exists) ─────────────
    // orderValue is the stored Order total (Stripe amount_total), with the
    // session amount as fallback. One commission per order on that trusted
    // total; trackPurchase() dedupes on orderId+productId so Stripe
    // redeliveries cannot double-credit.
    const trustedOrderValue =
      order.total || (data.amount_total ? data.amount_total / 100 : 0);
    const firstItem = lineItemsRaw[0];
    const affiliateProductId =
      (firstItem?.price_data?.product_data?.metadata?.productId ??
        firstItem?.price_data?.product_data?.id ??
        "") as string;

    if (firstItem && affiliateProductId && trustedOrderValue > 0) {
      try {
        await trackPurchase({
          userId: data.metadata?.userId ?? "",
          email: data.customer_details?.email ?? "",
          orderValue: trustedOrderValue,
          orderId: data.id,
          productId: affiliateProductId,
          productName:
            (firstItem.price_data?.product_data?.name as string) ?? "Product",
          referralCode: data.metadata?.referralCode ?? null,
        });
      } catch (err) {
        console.error(`[affiliate] tracking failed for order ${data.id}:`, err);
      }
    }

    // Fall back to the fetched Stripe line items when the legacy metadata
    // mirror is missing, so order emails still render.
    const orderItems = buildOrderItems(
      lineItemsRaw.length > 0
        ? lineItemsRaw
        : stripeLineItems.data.map((li) => ({
            name: li.description ?? "Product",
            quantity: li.quantity ?? 1,
            price_data: {
              unit_amount: li.price?.unit_amount ?? 0,
              product_data: { images: [] as string[] },
            },
          }))
    );
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

    // ── CJ auto-fulfillment (Phase 4) ───────────────────────────
    // Fire-and-forget: the Inngest function resolves CJ line items and
    // no-ops if the order contains none. Keeps the webhook fast/resilient.
    try {
      await inngest.send({
        name: "cj/order.fulfill",
        data: { orderId: order.id, sessionId: data.id },
      });
    } catch (err) {
      console.error("[webhook] failed to enqueue cj/order.fulfill:", err);
    }
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

    // ── Persist real OrderLineItem rows ─────────────────────────
    // Built from the metadata mirror written by checkout-session.ts
    // ({ productId, variantId, variantTitle, name, image, unit_amount, quantity }).
    const piLineItemRows: OrderLineItemRow[] = lineItemsRaw.map((entry) => {
      const quantity = entry.quantity ?? 1;
      const unitPrice = entry.unit_amount ?? 0;
      return {
        orderId: order.id,
        variantId: typeof entry.variantId === "string" ? entry.variantId : null,
        productName: entry.name ?? "Product",
        variantTitle: entry.variantTitle ?? "Default",
        sku: null,
        image: entry.image || null,
        unitPrice,
        quantity,
        totalPrice: unitPrice * quantity,
      };
    });

    await persistOrderLineItems(order.id, piLineItemRows);

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

    // Orders are keyed by session id (cs_…) for Checkout payments and by
    // payment-intent id (pi_…) for direct PI payments. Resolve the owning
    // Checkout session so clawback can find commissions tracked under it.
    let sessionOrderId: string | null = null;
    try {
      const sessions = await stripeClient.checkout.sessions.list({
        payment_intent: paymentIntentId,
        limit: 1,
      });
      sessionOrderId = sessions.data[0]?.id ?? null;
    } catch (err) {
      console.error("[webhook] failed to resolve checkout session for refund:", err);
    }

    const orderIds = [
      ...new Set(
        [paymentIntentId, sessionOrderId].filter((id): id is string => !!id)
      ),
    ];

    for (const orderId of orderIds) {
      await prisma.order.updateMany({
        where: { id: orderId },
        data: {
          status: "refunded",
          updatedAt: new Date(),
        },
      });
    }

    // ── Commission clawback ─────────────────────────────────────
    // Reverse every commission attributed to the refunded order. Commissions
    // carry no orderId column; they are located via the description prefix
    // written by trackPurchase(). refund() is idempotent per commission.
    for (const orderId of orderIds) {
      const commissions = await prisma.commission.findMany({
        where: {
          description: { startsWith: `Purchase commission for order ${orderId}` },
        },
        select: { id: true },
      });

      for (const c of commissions) {
        try {
          await refund({
            orderId,
            commissionId: c.id,
            reason: `Order refunded (charge ${charge.id})`,
          });
        } catch (err) {
          console.error(`[affiliate] clawback failed for commission ${c.id}:`, err);
        }
      }
    }
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
