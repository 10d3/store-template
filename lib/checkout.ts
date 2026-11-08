"use server";

import { headers } from "next/headers";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

interface CheckoutItem {
  variantId: string;
  quantity: number;
}

async function getBaseUrl() {
  const env = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_APP_URL;
  if (env) return env.replace(/\/$/, "");
  const h = await headers();
  const host = h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? "http";
  return `${proto}://${host}`;
}

export async function createCheckoutSession(
  rawItems: CheckoutItem[],
  addressId?: string
): Promise<{ url: string } | { error: string }> {
  if (!Array.isArray(rawItems) || rawItems.length === 0) {
    return { error: "Your cart is empty." };
  }

  const quantities = new Map<string, number>();
  for (const item of rawItems) {
    if (!item?.variantId || !Number.isInteger(item.quantity)) {
      return { error: "Your cart contains an invalid item." };
    }
    quantities.set(
      item.variantId,
      Math.min(99, (quantities.get(item.variantId) ?? 0) + Math.max(1, item.quantity))
    );
  }

  const variants = await prisma.productVariant.findMany({
    where: {
      id: { in: [...quantities.keys()] },
      active: true,
      product: { status: "ACTIVE" },
    },
    include: {
      product: {
        include: { images: { orderBy: { position: "asc" }, take: 1 } },
      },
    },
  });

  if (variants.length !== quantities.size) {
    return { error: "One or more items are no longer available." };
  }

  for (const variant of variants) {
    const quantity = quantities.get(variant.id) ?? 0;
    if (variant.trackInventory && variant.stock < quantity) {
      return {
        error:
          variant.stock <= 0
            ? `${variant.product.name} is out of stock.`
            : `Only ${variant.stock} of ${variant.product.name} left.`,
      };
    }
  }

  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = variants.map(
    (variant) => {
      const quantity = quantities.get(variant.id) ?? 1;
      const image = variant.image ?? variant.product.images[0]?.url;
      return {
        quantity,
        price_data: {
          currency: (process.env.STRIPE_CURRENCY ?? "usd").toLowerCase(),
          unit_amount: variant.price,
          product_data: {
            name:
              variant.title === "Default"
                ? variant.product.name
                : `${variant.product.name} — ${variant.title}`,
            description: variant.product.description?.slice(0, 300) ?? undefined,
            images: image?.startsWith("http") ? [image] : undefined,
            metadata: {
              variantId: variant.id,
              productId: variant.productId,
              variantTitle: variant.title,
              sku: variant.sku ?? "",
              image: image ?? "",
            },
          },
        },
      };
    }
  );

  const shippingCents = Number(process.env.FLAT_SHIPPING_CENTS ?? "0");
  const shippingOptions =
    Number.isFinite(shippingCents) && shippingCents > 0
      ? [
          {
            shipping_rate_data: {
              type: "fixed_amount" as const,
              fixed_amount: {
                amount: shippingCents,
                currency: (process.env.STRIPE_CURRENCY ?? "usd").toLowerCase(),
              },
              display_name:
                process.env.FLAT_SHIPPING_LABEL ?? "Standard shipping",
            },
          },
        ]
      : undefined;

  const session = await getSession();
  const baseUrl = await getBaseUrl();
  const stripe = getStripe();
  let stripeCustomerId: string | undefined;

  if (session) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { stripeCustomerId: true },
    });
    stripeCustomerId = user?.stripeCustomerId ?? undefined;

    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: session.user.email,
        name: session.user.name,
        metadata: { userId: session.user.id },
      });
      stripeCustomerId = customer.id;
      await prisma.user.update({
        where: { id: session.user.id },
        data: { stripeCustomerId },
      });
    }

    if (addressId) {
      const address = await prisma.address.findFirst({
        where: { id: addressId, userId: session.user.id },
      });
      if (!address) {
        return { error: "That shipping address could not be found." };
      }

      await stripe.customers.update(stripeCustomerId, {
        shipping: {
          name: address.name,
          phone: address.phone ?? undefined,
          address: {
            line1: address.line1,
            line2: address.line2 ?? undefined,
            city: address.city,
            state: address.state ?? undefined,
            postal_code: address.postalCode,
            country: address.country,
          },
        },
      });
    }
  }

  try {
    const checkout = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: lineItems,
      allow_promotion_codes: true,
      billing_address_collection: "auto",
      phone_number_collection: { enabled: true },
      shipping_address_collection: {
        allowed_countries: ["US", "CA", "GB", "AU", "DE", "FR"],
      },
      shipping_options: shippingOptions,
      customer: stripeCustomerId,
      customer_email: stripeCustomerId ? undefined : session?.user.email,
      customer_update: stripeCustomerId ? { shipping: "auto" } : undefined,
      success_url: `${baseUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/cart`,
      metadata: {
        userId: session?.user.id ?? "",
        email: session?.user.email ?? "",
        name: session?.user.name ?? "",
      },
    });

    if (!checkout.url) {
      return { error: "Stripe did not return a checkout URL." };
    }
    return { url: checkout.url };
  } catch (error) {
    console.error("[checkout] session creation failed:", error);
    return { error: "Could not start checkout. Please try again." };
  }
}
