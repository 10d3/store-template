"use server";
import { cookies, headers } from "next/headers";
import { auth } from "../auth";
// import { getCachedProducts } from "../product/cache";
import { CartItem } from "../store";
import { prisma } from "../prisma";
import { stripeClient } from "../stripe";

async function getBaseUrl(): Promise<string> {
  const envUrl = process.env.NEXT_PUBLIC_BASE_URL;
  if (envUrl) return envUrl;
  
  const headersList = await headers();
  const host = headersList.get("host") || "localhost:3000";
  const protocol = headersList.get("x-forwarded-proto") || "http";
  return `${protocol}://${host}`;
}

/**
 * Resolves a valid live Stripe customer ID for the user.
 * If the stored ID is stale (e.g. from test mode), creates a fresh one.
 */
async function getOrCreateStripeCustomer(
  userId: string,
  email: string | null | undefined,
  name: string | null | undefined,
  storedCustomerId: string | null | undefined
): Promise<string> {
  // Try to use the stored ID — but verify it actually exists in Stripe
  if (storedCustomerId) {
    try {
      const existing = await stripeClient.customers.retrieve(storedCustomerId);
      if (!existing.deleted) return existing.id;
    } catch {
      // Customer not found in live Stripe (stale test ID) — fall through to create
      console.warn(`Stale Stripe customer ID ${storedCustomerId} — creating new live customer`);
    }
  }

  // Create a new customer in live Stripe
  const customer = await stripeClient.customers.create({
    email: email ?? undefined,
    name: name ?? undefined,
    metadata: { userId },
  });

  // Persist the new live ID to the DB
  await prisma.user.update({
    where: { id: userId },
    data: { stripeCustomerId: customer.id },
  });


  return customer.id;
}

/**
 * Create a guest checkout session (no authentication required).
 * Used when customers want to purchase without creating an account.
 */
export async function createGuestCheckoutSession(cart: CartItem[], name?: string) {
  const cookiesStore = await cookies();
  const referralCode = cookiesStore.get("referral_code")?.value || null;
  const baseUrl = await getBaseUrl();

  const line_items_stripe = cart.map((item) => {
    if (item.stripePriceId) {
      return { price: item.stripePriceId, quantity: item.quantity };
    }
    let imageUrl = item.image;
    if (imageUrl?.startsWith("/")) imageUrl = `${baseUrl}${imageUrl}`;
    return {
      price_data: {
        currency: "usd",
        product_data: {
          name: item.name,
          images: imageUrl ? [imageUrl] : [],
          metadata: { productId: item.id, ...item.metadata },
        },
        unit_amount: item.price,
      },
      quantity: item.quantity,
    };
  });

  const line_items = cart.map((item) => ({
    price_data: {
      currency: "usd",
      product_data: { name: item.name, images: [item?.image as string] },
      unit_amount: item.price,
    },
    quantity: item.quantity,
  }));

  const sessionStripe = await stripeClient.checkout.sessions.create({
    payment_method_types: ["card", "link"],
    // No `customer` or `customer_email` — Stripe collects it during checkout
    shipping_address_collection: {
      allowed_countries: ["US", "CA", "GB", "AU", "DE", "FR"],
    },
    line_items: line_items_stripe,
    mode: "payment",
    success_url: `${baseUrl}/success`,
    cancel_url: baseUrl,
    metadata: {
      userId: "",
      isGuest: "true",
      customerName: name || "",
      line_items: JSON.stringify(line_items),
      referralCode,
    },
  });

  return sessionStripe.url;
}

/**
 * Create a guest checkout session for a single product (no authentication required).
 * Used for "Buy Now" functionality without an account.
 */
export async function createGuestCheckoutSessionNow(
  product: CartItem,
  name?: string
) {
  const cookiesStore = await cookies();
  const referralCode = cookiesStore.get("referral_code")?.value || null;
  const baseUrl = await getBaseUrl();

  let line_items: any;

  if (product.stripePriceId) {
    line_items = {
      price: product.stripePriceId,
      quantity: product.quantity,
    };
  } else {
    let imageUrl = product.image;
    if (imageUrl && imageUrl.startsWith("/")) {
      imageUrl = `${baseUrl}${imageUrl}`;
    }
    
    line_items = {
      price_data: {
        currency: "usd",
        product_data: {
          name: product.name,
          images: imageUrl ? [imageUrl] : [],
          metadata: {
            product_id: product.id
          }
        },
        unit_amount: product.price
      },
      quantity: product.quantity,
    }
  }

  try {
    const sessionStripe = await stripeClient.checkout.sessions.create({
      payment_method_types: ["card", "link"],
      // customer_email: "required",
      shipping_address_collection: {
        allowed_countries: ["US", "CA"],
      },
      line_items: [line_items],
      mode: "payment",
      success_url: `${baseUrl}/success`,
      cancel_url: baseUrl,
      metadata: {
        userId: "",
        isGuest: "true",
        customerName: name || "",
        line_items: JSON.stringify([line_items]),
        referralCode
      },
    });

    return sessionStripe.url;
  } catch (error) {
    console.error("createGuestCheckoutSessionNow: Error creating Stripe session:", error);
    throw error;
  }
}

export async function createCheckoutSession(cart: CartItem[]) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    console.error("createCheckoutSession: No session found");
    throw new Error("No session found");
  }
  const cookiesStore = await cookies();
  const referralCode = cookiesStore.get("referral_code")?.value || null;
  const baseUrl = await getBaseUrl();

  const line_items = cart.map((item) => ({
    price_data: {
      currency: "usd",
      product_data: {
        id: item.id,
        name: item.name,
        images: [item?.image as string],
      },
      unit_amount: item.price
    },
    quantity: item.quantity,
  }));

  const line_items_stripe = cart.map((item) => {
    if (item.stripePriceId) {
      return {
        price: item.stripePriceId,
        quantity: item.quantity
      };
    } else {
      let imageUrl = item.image;
      if (imageUrl && imageUrl.startsWith("/")) {
        imageUrl = `${baseUrl}${imageUrl}`;
      }

      return {
        price_data: {
          currency: "usd",
          product_data: {
            name: item.name,
            images: imageUrl ? [imageUrl] : [],
            metadata: {
              productId: item.id,
              ...item.metadata
            }
          },
          unit_amount: item.price
        },
        quantity: item.quantity
      };
    }
  });


  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { stripeCustomerId: true, email: true, name: true },
  });

  const stripeCustomerId = await getOrCreateStripeCustomer(
    session.user.id,
    user?.email ?? session.user.email,
    user?.name ?? session.user.name,
    user?.stripeCustomerId ?? session.user.stripeCustomerId
  );

  try {
    const sessionStripe = await stripeClient.checkout.sessions.create({
      payment_method_types: ["card", "link"],
      customer: stripeCustomerId as string,
      shipping_address_collection: {
        allowed_countries: ["US", "CA", "GB", "AU", "DE", "FR"],
      },
      line_items: line_items_stripe,
      mode: "payment",
      success_url: `${baseUrl}/success`,
      cancel_url: baseUrl,
      metadata: {
        userId: session.user.id,
        line_items: JSON.stringify(line_items),
        referralCode
      },
    });

    return sessionStripe.url;
  } catch (error) {
    console.error("createCheckoutSession: Error creating Stripe session:", error);
    throw error;
  }
}

export async function createCheckoutSessionNow(product: CartItem) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    throw new Error("No session found");
  }
  const cookiesStore = await cookies();
  const referralCode = cookiesStore.get("referral_code")?.value || null;
  const baseUrl = await getBaseUrl();

  let line_items: any;

  if (product.stripePriceId) {
    line_items = {
      price: product.stripePriceId,
      quantity: product.quantity,
    };
  } else {
    line_items = {
      price_data: {
        currency: "usd",
        product_data: {
          name: product.name,
          images: [product?.image as string],
          metadata: {
            product_id: product.id
          }
        },
        unit_amount: product.price
      },
      quantity: product.quantity,
    }
  }

  const user2 = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { stripeCustomerId: true, email: true, name: true },
  });

  const stripeCustomerId = await getOrCreateStripeCustomer(
    session.user.id,
    user2?.email ?? session.user.email,
    user2?.name ?? session.user.name,
    user2?.stripeCustomerId ?? session.user.stripeCustomerId
  );

  const sessionStripe = await stripeClient.checkout.sessions.create({
    payment_method_types: ["card", "link"],
    customer: stripeCustomerId as string,
    shipping_address_collection: {
      allowed_countries: ["US", "CA", "GB", "AU", "DE", "FR"],
    },
    line_items: [line_items],
    mode: "payment",
    success_url: `${baseUrl}/success`,
    cancel_url: baseUrl,
    metadata: {
      userId: session.user.id,
      line_items: JSON.stringify([line_items]),
      referralCode
    },
  });

  return sessionStripe.url;
}