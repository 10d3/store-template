"use server";
import { cookies, headers } from "next/headers";
import { auth } from "../auth";
import { getCachedProducts } from "../product/cache";
import { CartItem } from "../store";
import { prisma } from "../prisma";
import { stripeClient } from "../stripe";

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

export async function createCheckoutSession(cart: CartItem[]) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    console.error("createCheckoutSession: No session found");
    throw new Error("No session found");
  }
  const cookiesStore = await cookies();
  const referralCode = cookiesStore.get("referral_code")?.value || null;

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

  // Construct line items directly from cart, prioritizing stripePriceId
  const line_items_stripe = cart.map((item) => {
    if (item.stripePriceId) {
      return {
        price: item.stripePriceId,
        quantity: item.quantity
      };
    } else {
      // Construct absolute image URL if needed
      let imageUrl = item.image;
      if (imageUrl && imageUrl.startsWith("/")) {
        imageUrl = `${process.env.NEXT_PUBLIC_BASE_URL}${imageUrl}`;
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
      line_items: line_items_stripe,
      mode: "payment",
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/success`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}`,
      metadata: {
        userId: session.user.id,
        // Optional: add more metadata if needed
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
          // Remove the 'id' field - it's not allowed here
          // Optionally add metadata to track your internal product ID
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
    line_items: [line_items],
    mode: "payment",
    success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/success`,
    cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}`,
    metadata: {
      userId: session.user.id,
      line_items: JSON.stringify([line_items]),
      referralCode
    },
  });

  return sessionStripe.url;
}