"use server";
import Stripe from "stripe";
import {
  CouponFormData,
  PackFormData,
  ProductFormData,
} from "./product.schema";
import type { StripeProduct, StripeCoupon } from "@/types/product";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  typescript: true,
});

// Transform Stripe Product to plain object
function transformProduct(product: Stripe.Product): StripeProduct {
  return {
    id: product.id,
    name: product.name,
    description: product.description,
    images: product.images,
    metadata: product.metadata,
    default_price: product.default_price
      ? typeof product.default_price === "string"
        ? product.default_price
        : {
            id: product.default_price.id,
            unit_amount: product.default_price.unit_amount,
            currency: product.default_price.currency,
          }
      : null,
    active: product.active,
  };
}

// Transform Stripe Coupon to plain object
function transformCoupon(coupon: Stripe.Coupon): StripeCoupon {
  return {
    id: coupon.id,
    name: coupon.name,
    percent_off: coupon.percent_off,
    amount_off: coupon.amount_off,
    currency: coupon.currency,
    duration: coupon.duration,
    valid: coupon.valid,
    metadata: coupon.metadata,
  };
}

export async function createProduct(data: ProductFormData) {
  const product = await stripe.products.create({
    name: data.name,
    description: data.description,
    images: data.images,
    metadata: data.metadata,
  });

  await stripe.prices.create({
    product: product.id,
    unit_amount: data.price,
    currency: data.currency,
  });

  return product;
}

export async function updateProduct(
  id: string,
  data: Partial<ProductFormData>
) {
  return await stripe.products.update(id, {
    name: data.name,
    description: data.description,
    images: data.images,
    metadata: data.metadata,
  });
}

export async function archiveProduct(id: string) {
  return await stripe.products.update(id, { active: false });
}

export async function createCoupon(data: CouponFormData) {
  return await stripe.coupons.create({
    ...data,
    duration: data.duration as Stripe.CouponCreateParams.Duration,
  });
}

// Add preset coupon creation
export async function updateCoupon(id: string, data: CouponFormData) {
  return await stripe.coupons.update(id, {
    name: data.name,
    metadata: {
      ...data,
    },
  });
}

export async function createPresetCoupon(preset: "4for3" | "15off3") {
  if (preset === "4for3") {
    return await stripe.coupons.create({
      name: "4-for-3 Deal",
      duration: "once",
      metadata: {
        type: "4for3",
        description: "Buy 3, get cheapest free",
      },
      // Note: The actual "cheapest free" logic would be handled in checkout
      amount_off: 0, // Placeholder - actual discount calculated server-side
    });
  }

  if (preset === "15off3") {
    return await stripe.coupons.create({
      name: "15% off 3+ items",
      duration: "once",
      percent_off: 15,
      metadata: {
        type: "bulk_discount",
        min_items: "3",
      },
    });
  }
}

// Update pack creation to use productIds directly
export async function createPack(data: PackFormData) {
  const product = await stripe.products.create({
    name: data.name,
    description: data.description,
    metadata: {
      type: "bundle",
      contents: data.productIds.join(","),
      discount: data?.discount?.toString() as string,
    },
  });

  await stripe.prices.create({
    product: product.id,
    unit_amount: data.packPrice,
    currency: "usd",
  });

  return product;
}

export async function updatePack(id: string, data: PackFormData) {
  // Update the product details
  const product = await stripe.products.update(id, {
    name: data.name,
    description: data.description,
    metadata: {
      type: "bundle",
      contents: data.productIds.join(","),
      discount: data?.discount?.toString() as string,
    },
  });

  // Note: Stripe doesn't allow updating prices directly
  // In a real application, you might want to create a new price and archive the old one
  // For now, we'll just update the product metadata
  
  return product;
}

export async function listProducts(): Promise<StripeProduct[]> {
  const products = await stripe.products.list({
    active: true,
    expand: ["data.default_price"],
    limit: 100,
  });
  return products.data.map(transformProduct);
}

export async function listCoupons(): Promise<StripeCoupon[]> {
  const coupons = await stripe.coupons.list({ limit: 100 });
  return coupons.data.map(transformCoupon);
}
