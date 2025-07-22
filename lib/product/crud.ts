'use server'

import { getStripeClient } from "../stripe";
import { CouponFormData, PackFormData, ProductFormData } from "./product.schema";
import type Stripe from "stripe";

const stripeClient = getStripeClient()

export async function createProduct(data: ProductFormData) {
  const product = await stripeClient.products.create({
    name: data.name,
    description: data.description,
    images: data.images,
    metadata: data.metadata,
  });

  await stripeClient.prices.create({
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
  return await stripeClient.products.update(id, {
    name: data.name,
    description: data.description,
    images: data.images,
    metadata: data.metadata,
  });
}

export async function archiveProduct(id: string) {
  return await stripeClient.products.update(id, { active: false });
}

export async function createCoupon(data: CouponFormData) {
  return await stripeClient.coupons.create({
    ...data,
    duration: data.duration as Stripe.CouponCreateParams.Duration,
  });
}

export async function createPack(data: PackFormData) {
  const product = await stripeClient.products.create({
    name: data.name,
    description: data.description,
    metadata: {
      type: "bundle",
      contents: data.priceIds.join(","),
      discount: data.discount.toString(),
    },
  });

  // Calculate pack price (example logic)
  const basePrice = data.priceIds.length * 1000; // Base calculation
  const discountedPrice = basePrice * (1 - data.discount / 100);

  await stripeClient.prices.create({
    product: product.id,
    unit_amount: Math.round(discountedPrice),
    currency: "usd",
  });

  return product;
}

export async function listProducts() {
  const products = await stripeClient.products.list({
    active: true,
    expand: ["data.default_price"],
    limit: 100,
  });
  return products.data;
}

export async function listCoupons() {
  const coupons = await stripeClient.coupons.list({ limit: 100 });
  return coupons.data;
}
