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
 * (unresolvable variants, invalid coupons). Message is safe to surface to users.
 */
class CheckoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CheckoutError";
  }
}

interface ResolvedItem {
  item: CartItem;
  /** Server-resolved variant. `price` is the authoritative unit price in CENTS. */
  variant: {
    id: string;
    price: number;
    title: string;
    productName: string;
  };
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
 * Server-side variant resolution for cart items. The client-supplied
 * `item.price` is NEVER trusted — the authoritative unit price is
 * `ProductVariant.price` (cents).
 *
 * Items whose `variantId` does not resolve to a ProductVariant fall back to
 * the product's first active variant (ordered by position asc). This tolerates
 * legacy bundle items, which store either the bundle product id or a Stripe
 * price id in `variantId`. Unresolvable items are rejected with CheckoutError.
 */
async function resolveCartPricing(cart: CartItem[]): Promise<ResolvedItem[]> {
  const ids = cart.map((i) => i.variantId).filter(Boolean);

  const variants = await prisma.productVariant.findMany({
    where: { id: { in: ids } },
    select: {
      id: true,
      price: true,
      title: true,
      product: { select: { id: true, name: true } },
    },
  });
  const variantById = new Map(variants.map((v) => [v.id, v]));

  // Items whose variantId did not resolve — try the product's first active
  // variant. Legacy bundle items may carry a product id or a Stripe price id
  // in `variantId`; either way the product id lives on `item.id`.
  const missingProductIds = Array.from(
    new Set(cart.filter((i) => !variantById.has(i.variantId)).map((i) => i.id))
  );

  const products = missingProductIds.length
    ? await prisma.product.findMany({
        where: { id: { in: missingProductIds } },
        select: {
          id: true,
          name: true,
          variants: {
            where: { active: true },
            orderBy: [{ position: "asc" }],
            take: 1,
            select: { id: true, price: true, title: true },
          },
        },
      })
    : [];
  const productById = new Map(products.map((p) => [p.id, p]));

  return cart.map((item) => {
    const direct = variantById.get(item.variantId);
    if (direct) {
      return {
        item,
        variant: {
          id: direct.id,
          price: direct.price,
          title: direct.title,
          productName: direct.product.name,
        },
      };
    }

    const product = productById.get(item.id);
    const fallback = product?.variants[0];
    if (product && fallback) {
      return {
        item,
        variant: {
          id: fallback.id,
          price: fallback.price,
          title: fallback.title,
          productName: product.name,
        },
      };
    }

    throw new CheckoutError(`No variant found for cart item ${item.id}`);
  });
}

/** Display name for a resolved variant: "Product — Variant" unless default. */
function variantDisplayName(variant: ResolvedItem["variant"]): string {
  return variant.title && variant.title !== "Default"
    ? `${variant.productName} — ${variant.title}`
    : variant.productName;
}

/**
 * Builds a Stripe line item from a server-resolved variant. Always uses
 * `price_data` (never a Stripe price id) so the authoritative
 * `ProductVariant.price` is what gets charged. Variant identity is written
 * into `product_data.metadata` for the webhook to read back.
 */
function buildLineItem(resolved: ResolvedItem, baseUrl: string): CheckoutLineItem {
  const { item, variant } = resolved;
  let imageUrl = item.image;
  if (imageUrl?.startsWith("/")) imageUrl = `${baseUrl}${imageUrl}`;

  return {
    price_data: {
      currency: "usd",
      product_data: {
        name: variantDisplayName(variant),
        ...(imageUrl ? { images: [imageUrl] } : {}),
        metadata: {
          productId: item.id,
          variantId: variant.id,
          variantTitle: variant.title,
          image: item.image ?? "",
        },
      },
      unit_amount: variant.price,
    },
    quantity: item.quantity,
  };
}

/**
 * Metadata mirror of a line item — built from SERVER-RESOLVED variant prices so
 * downstream consumers (webhook order totals, affiliate commissions) get
 * trusted values. `unit_amount` is in cents.
 */
function buildMirrorEntry(resolved: ResolvedItem) {
  const { item, variant } = resolved;
  return {
    productId: item.id,
    variantId: variant.id,
    variantTitle: variant.title,
    name: variantDisplayName(variant),
    image: item.image ?? "",
    unit_amount: variant.price,
    quantity: item.quantity,
  };
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

  const line_items_stripe: CheckoutLineItem[] = resolved.map((r) =>
    buildLineItem(r, baseUrl)
  );

  // Metadata mirror of the line items — built from SERVER-RESOLVED variant
  // prices so downstream consumers (webhook order totals, affiliate
  // commissions) get trusted values.
  const line_items = resolved.map(buildMirrorEntry);

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

  const line_items = buildLineItem(resolvedProduct, baseUrl);
  const mirror = buildMirrorEntry(resolvedProduct);

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
        line_items: JSON.stringify([mirror]),
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

  // Metadata mirror of the line items — built from SERVER-RESOLVED variant prices.
  const line_items = resolved.map(buildMirrorEntry);

  const line_items_stripe: CheckoutLineItem[] = resolved.map((r) =>
    buildLineItem(r, baseUrl)
  );


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

  const line_items = buildLineItem(resolvedProduct, baseUrl);
  const mirror = buildMirrorEntry(resolvedProduct);

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
      line_items: JSON.stringify([mirror]),
      referralCode
    },
  });

  return sessionStripe.url;
}
