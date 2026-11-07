import type Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";
import { generateOrderNumber } from "@/lib/order-number";
import { sendOrderConfirmationEmail } from "@/lib/email";
import { Prisma } from "@/lib/generated/prisma";

export const runtime = "nodejs";

function lineItemMetadata(
  product: string | Stripe.Product | Stripe.DeletedProduct | null | undefined
) {
  if (!product || typeof product === "string" || product.deleted) {
    return {} as Stripe.Metadata;
  }
  return product.metadata ?? ({} as Stripe.Metadata);
}

function address(address: Stripe.Address | null | undefined) {
  if (!address) return null;
  return {
    line1: address.line1,
    line2: address.line2,
    city: address.city,
    state: address.state,
    postalCode: address.postal_code,
    country: address.country,
  };
}

async function handlePaidSession(session: Stripe.Checkout.Session) {
  const existing = await prisma.order.findUnique({
    where: { stripeSessionId: session.id },
  });
  if (existing) return;

  const stripe = getStripe();
  const full = await stripe.checkout.sessions.retrieve(session.id, {
    expand: ["line_items.data.price.product"],
  });

  const lineItems = full.line_items?.data ?? [];
  if (lineItems.length === 0) {
    console.error("[stripe] paid session has no line items:", session.id);
    return;
  }

  const variantIds = lineItems
    .map((item) => lineItemMetadata(item.price?.product).variantId)
    .filter((id): id is string => Boolean(id));

  const variants = await prisma.productVariant.findMany({
    where: { id: { in: variantIds } },
    include: { product: true },
  });
  const variantMap = new Map(variants.map((variant) => [variant.id, variant]));

  const items = lineItems.map((item) => {
    const metadata = lineItemMetadata(item.price?.product);
    const variant = metadata.variantId
      ? variantMap.get(metadata.variantId)
      : undefined;
    const quantity = item.quantity ?? 1;
    const unitPrice =
      item.price?.unit_amount ??
      Math.round((item.amount_subtotal ?? 0) / Math.max(1, quantity));

    return {
      variantId: variant?.id ?? null,
      productName: variant?.product.name ?? metadata.productName ?? item.description ?? "Item",
      variantTitle: variant?.title ?? metadata.variantTitle ?? "Default",
      sku: variant?.sku ?? metadata.sku ?? null,
      image: variant?.image ?? metadata.image ?? null,
      unitPrice,
      quantity,
      total: item.amount_subtotal ?? unitPrice * quantity,
    };
  });

  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const discount = full.total_details?.amount_discount ?? 0;
  const shipping = full.total_details?.amount_shipping ?? 0;
  const tax = full.total_details?.amount_tax ?? 0;
  const total = full.amount_total ?? subtotal - discount + shipping + tax;

  const userId = full.metadata?.userId || null;
  const user = userId
    ? await prisma.user.findUnique({ where: { id: userId }, select: { id: true } })
    : null;

  const email =
    full.customer_details?.email ??
    full.customer_email ??
    full.metadata?.email ??
    "unknown@example.com";

  const shippingDetails = full.collected_information?.shipping_details;
  const shippingAddress = shippingDetails
    ? { name: shippingDetails.name, ...(address(shippingDetails.address) ?? {}) }
    : undefined;
  const billingAddress = address(full.customer_details?.address) ?? undefined;

  let orderId: string | null = null;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      orderId = await prisma.$transaction(async (tx) => {
        const created = await tx.order.create({
          data: {
            orderNumber: generateOrderNumber(),
            userId: user?.id ?? null,
            email,
            name: shippingDetails?.name ?? full.metadata?.name ?? null,
            status: "PAID",
            paymentStatus: "PAID",
            currency: (full.currency ?? "usd").toLowerCase(),
            subtotal,
            discount,
            shipping,
            tax,
            total,
            shippingAddress,
            billingAddress,
            stripeSessionId: full.id,
            stripePaymentIntentId:
              typeof full.payment_intent === "string"
                ? full.payment_intent
                : full.payment_intent?.id ?? null,
            items: { create: items },
          },
        });

        for (const item of items) {
          if (!item.variantId) continue;
          const variant = variantMap.get(item.variantId);
          if (!variant?.trackInventory) continue;
          // shortcut: stock is decremented after payment, without reservation.
          // Upgrade to reservations if overselling becomes a problem.
          const result = await tx.productVariant.updateMany({
            where: { id: item.variantId, stock: { gte: item.quantity } },
            data: { stock: { decrement: item.quantity } },
          });
          if (result.count === 0) {
            console.warn(
              `[stripe] stock for variant ${item.variantId} was already below ${item.quantity}; order ${created.orderNumber} still recorded`
            );
          }
        }

        return created.id;
      });
      break;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002" &&
        attempt < 2
      ) {
        continue;
      }
      throw error;
    }
  }

  if (!orderId) {
    console.error("[stripe] could not create order for session:", session.id);
    return;
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });
  if (!order) {
    console.error("[stripe] order disappeared after creation:", orderId);
    return;
  }

  await sendOrderConfirmationEmail({
    email,
    orderNumber: order.orderNumber,
    customerName: order.name,
    items: order.items.map((item) => ({
      productName: item.productName,
      variantTitle: item.variantTitle,
      quantity: item.quantity,
      total: item.total,
    })),
    subtotal: order.subtotal,
    discount: order.discount,
    shipping: order.shipping,
    tax: order.tax,
    total: order.total,
    currency: order.currency,
  }).catch((error) => console.error("[email] order confirmation failed:", error));
}

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !secret) {
    return new Response("Missing Stripe signature or webhook secret", {
      status: 400,
    });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(
      await request.text(),
      signature,
      secret
    );
  } catch (error) {
    console.error("[stripe] webhook signature verification failed:", error);
    return new Response("Invalid signature", { status: 400 });
  }

  try {
    if (
      (event.type === "checkout.session.completed" ||
        event.type === "checkout.session.async_payment_succeeded") &&
      event.data.object.payment_status === "paid"
    ) {
      await handlePaidSession(event.data.object);
    }

    if (event.type === "charge.refunded" && event.data.object.refunded) {
      const paymentIntent = event.data.object.payment_intent;
      const paymentIntentId =
        typeof paymentIntent === "string" ? paymentIntent : paymentIntent?.id;
      if (paymentIntentId) {
        await prisma.order.updateMany({
          where: { stripePaymentIntentId: paymentIntentId },
          data: { status: "REFUNDED", paymentStatus: "REFUNDED" },
        });
      }
    }
  } catch (error) {
    console.error(`[stripe] webhook handler failed for ${event.type}:`, error);
    return new Response("Webhook handler failed", { status: 500 });
  }

  return Response.json({ received: true });
}
