"use server";
import Stripe from "stripe";
import { cookies, headers } from "next/headers";
import { auth } from "../auth";
// import { getCachedProducts } from "../product/cache";
import { CartItem } from "../store";
import { prisma } from "../prisma";
import { stripeClient } from "../stripe";
import { assertStockAvailable } from "./validate-stock";

type CheckoutLineItem = Stripe.Checkout.SessionCreateParams.LineItem;

/**
 * Typed error for checkout failures caused by untrusted/invalid client data
 * (unresolvable prices, invalid coupons). Message is safe to surface to users.
 */
class CheckoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CheckoutError";
  }
}

interface ResolvedItem {
  item: CartItem;
  /** Server-resolved unit price in CENTS. Never taken from the client cart. */
  unitAmount: number;
}

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
 * Retrieves a Stripe Price and returns its authoritative unit_amount (cents).
 * Rejects the item when the price does not exist or has no amount.
 */
async function retrieveStripePriceUnitAmount(
  stripePriceId: string,
  itemName: string
): Promise<number> {
  let price: Stripe.Price;
  try {
    price = await stripeClient.prices.retrieve(stripePriceId);
  } catch (error) {
    if (error instanceof Stripe.errors.StripeInvalidRequestError) {
      throw new CheckoutError(
        `We couldn't verify the price for "${itemName}". Please remove it from your cart and try again.`
      );
    }
    throw error;
  }
  if (typeof price.unit_amount !== "number") {
    throw new CheckoutError(
      `The price for "${itemName}" could not be determined. Please contact support.`
    );
  }
  return price.unit_amount;
}

/**
 * Server-side price resolution for a single cart item. The client-supplied
 * `item.price` is NEVER trusted.
 *
 * (a) item.stripePriceId → the real Stripe Price object's unit_amount.
 * (b) no stripePriceId → resolve authoritatively from our DB:
 *     - variant-linked items point at their variant's Stripe price;
 *     - otherwise the product's active Price row (default first).
 * (c) unresolvable → reject with a typed CheckoutError.
 */
async function resolveItemUnitAmount(item: CartItem): Promise<number> {
  // (a) Real Stripe Price object — trust only what Stripe returns.
  if (item.stripePriceId) {
    return retrieveStripePriceUnitAmount(item.stripePriceId, item.name);
  }

  // (b1) Variant-linked items resolve through their variant's Stripe price.
  if (item.variantId) {
    const variant = await prisma.productVariant.findUnique({
      where: { id: item.variantId },
      select: { stripePriceId: true },
    });
    if (variant?.stripePriceId) {
      return retrieveStripePriceUnitAmount(variant.stripePriceId, item.name);
    }
  }

  // (b2) Fall back to the product's active price row in our DB.
  const dbPrice = await prisma.price.findFirst({
    where: { productId: item.id, active: true },
    orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
  });
  if (dbPrice && typeof dbPrice.unitAmount === "number") {
    return dbPrice.unitAmount;
  }

  // (c) Unresolvable — never charge a client-supplied amount.
  throw new CheckoutError(
    `We couldn't verify the price for "${item.name}". Please remove it from your cart and try again.`
  );
}

/** Resolves every cart item's unit price server-side before any charge. */
async function resolveCartPricing(cart: CartItem[]): Promise<ResolvedItem[]> {
  return Promise.all(
    cart.map(async (item) => ({
      item,
      unitAmount: await resolveItemUnitAmount(item),
    }))
  );
}

/**
 * Validates a coupon code against Stripe (the system of record for coupons —
 * they are created via lib/product/crud.ts createCoupon / admin presets).
 *
 * Accepts either the Stripe coupon id itself or a code linked via coupon
 * metadata.dbId. Expired/inactive coupons are rejected. Returns null when no
 * coupon was supplied so sessions stay byte-identical to the no-coupon path.
 */
async function resolveStripeCouponId(couponCode?: string): Promise<string | null> {
  const code = couponCode?.trim();
  if (!code) return null;

  let retrieved: Stripe.Coupon | null = null;
  try {
    retrieved = await stripeClient.coupons.retrieve(code);
    if (!retrieved.valid) {
      throw new CheckoutError(`Coupon "${code}" is expired or no longer active.`);
    }
    return retrieved.id;
  } catch (error) {
    if (error instanceof CheckoutError) throw error;
    // Unknown id — fall through to the metadata.dbId lookup below.
  }

  const listed = await stripeClient.coupons.list({ limit: 100 });
  const match = listed.data.find((c) => c.metadata?.dbId === code);
  if (match?.valid) return match.id;

  throw new CheckoutError(
    `Coupon "${code}" is invalid, expired, or no longer active.`
  );
}

/**
 * Create a guest checkout session (no authentication required).
 * Used when customers want to purchase without creating an account.
 */
export async function createGuestCheckoutSession(cart: CartItem[], name?: string, couponCode?: string) {
  await assertStockAvailable(cart);
  const resolved = await resolveCartPricing(cart);
  const stripeCouponId = await resolveStripeCouponId(couponCode);
  const cookiesStore = await cookies();
  const referralCode = cookiesStore.get("referral_code")?.value || null;
  const baseUrl = await getBaseUrl();

  const line_items_stripe: CheckoutLineItem[] = resolved.map(({ item, unitAmount }) => {
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
        unit_amount: unitAmount,
      },
      quantity: item.quantity,
    };
  });

  // Metadata mirror of the line items — built from SERVER-RESOLVED prices so
  // downstream consumers (webhook order totals, affiliate commissions) get
  // trusted values. Same shape/keys as before.
  const line_items = resolved.map(({ item, unitAmount }) => ({
    price_data: {
      currency: "usd",
      product_data: { name: item.name, images: [item?.image as string] },
      unit_amount: unitAmount,
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
    ...(stripeCouponId ? { discounts: [{ coupon: stripeCouponId }] } : {}),
    mode: "payment",
    success_url: `${baseUrl}/success`,
    cancel_url: baseUrl,
    metadata: {
      // No userId key for guests — omitted entirely so downstream
      // `metadata.userId ?? null` guards cannot be bypassed by "".
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
  name?: string,
  couponCode?: string
) {
  await assertStockAvailable([product]);
  const [resolvedProduct] = await resolveCartPricing([product]);
  const stripeCouponId = await resolveStripeCouponId(couponCode);
  const cookiesStore = await cookies();
  const referralCode = cookiesStore.get("referral_code")?.value || null;
  const baseUrl = await getBaseUrl();

  let line_items: CheckoutLineItem;

  if (resolvedProduct.item.stripePriceId) {
    line_items = {
      price: resolvedProduct.item.stripePriceId,
      quantity: resolvedProduct.item.quantity,
    };
  } else {
    let imageUrl = resolvedProduct.item.image;
    if (imageUrl && imageUrl.startsWith("/")) {
      imageUrl = `${baseUrl}${imageUrl}`;
    }
    
    line_items = {
      price_data: {
        currency: "usd",
        product_data: {
          name: resolvedProduct.item.name,
          images: imageUrl ? [imageUrl] : [],
          metadata: {
            product_id: resolvedProduct.item.id
          }
        },
        unit_amount: resolvedProduct.unitAmount
      },
      quantity: resolvedProduct.item.quantity,
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
      ...(stripeCouponId ? { discounts: [{ coupon: stripeCouponId }] } : {}),
      mode: "payment",
      success_url: `${baseUrl}/success`,
      cancel_url: baseUrl,
      metadata: {
        // No userId key for guests — omitted entirely so downstream
        // `metadata.userId ?? null` guards cannot be bypassed by "".
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

export async function createCheckoutSession(cart: CartItem[], couponCode?: string) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    console.error("createCheckoutSession: No session found");
    throw new Error("No session found");
  }
  await assertStockAvailable(cart);
  const resolved = await resolveCartPricing(cart);
  const stripeCouponId = await resolveStripeCouponId(couponCode);
  const cookiesStore = await cookies();
  const referralCode = cookiesStore.get("referral_code")?.value || null;
  const baseUrl = await getBaseUrl();

  // Metadata mirror of the line items — built from SERVER-RESOLVED prices.
  // Same shape/keys as before.
  const line_items = resolved.map(({ item, unitAmount }) => ({
    price_data: {
      currency: "usd",
      product_data: {
        id: item.id,
        name: item.name,
        images: [item?.image as string],
      },
      unit_amount: unitAmount
    },
    quantity: item.quantity,
  }));

  const line_items_stripe: CheckoutLineItem[] = resolved.map(({ item, unitAmount }) => {
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
          unit_amount: unitAmount
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
      ...(stripeCouponId ? { discounts: [{ coupon: stripeCouponId }] } : {}),
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

export async function createCheckoutSessionNow(product: CartItem, couponCode?: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    throw new Error("No session found");
  }
  await assertStockAvailable([product]);
  const [resolvedProduct] = await resolveCartPricing([product]);
  const stripeCouponId = await resolveStripeCouponId(couponCode);
  const cookiesStore = await cookies();
  const referralCode = cookiesStore.get("referral_code")?.value || null;
  const baseUrl = await getBaseUrl();

  let line_items: CheckoutLineItem;

  if (resolvedProduct.item.stripePriceId) {
    line_items = {
      price: resolvedProduct.item.stripePriceId,
      quantity: resolvedProduct.item.quantity,
    };
  } else {
    line_items = {
      price_data: {
        currency: "usd",
        product_data: {
          name: resolvedProduct.item.name,
          images: [resolvedProduct.item?.image as string],
          metadata: {
            product_id: resolvedProduct.item.id
          }
        },
        unit_amount: resolvedProduct.unitAmount
      },
      quantity: resolvedProduct.item.quantity,
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
    ...(stripeCouponId ? { discounts: [{ coupon: stripeCouponId }] } : {}),
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
