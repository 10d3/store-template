"use server"
import Stripe from "stripe"
import { CouponFormData, PackFormData, ProductFormData } from "./product.schema"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  typescript: true,
})

export async function createProduct(data: ProductFormData) {
  const product = await stripe.products.create({
    name: data.name,
    description: data.description,
    images: data.images,
    metadata: data.metadata,
  })

  await stripe.prices.create({
    product: product.id,
    unit_amount: data.price,
    currency: data.currency,
  })

  return product
}

export async function updateProduct(id: string, data: Partial<ProductFormData>) {
  return await stripe.products.update(id, {
    name: data.name,
    description: data.description,
    images: data.images,
    metadata: data.metadata,
  })
}

export async function archiveProduct(id: string) {
  return await stripe.products.update(id, { active: false })
}

export async function createCoupon(data: CouponFormData) {
  return await stripe.coupons.create({
    ...data,
    duration: data.duration as Stripe.CouponCreateParams.Duration,
  })
}

// Add preset coupon creation
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
      currency: "usd",
    })
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
    })
  }

  throw new Error(`Unknown preset: ${preset}`)
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
  })

  await stripe.prices.create({
    product: product.id,
    unit_amount: data.packPrice,
    currency: "usd",
  })

  return product
}

export async function listProducts() {
  const products = await stripe.products.list({
    active: true,
    expand: ["data.default_price"],
    limit: 100,
  })
  return products.data
}

export async function listCoupons() {
  const coupons = await stripe.coupons.list({ limit: 100 })
  return coupons.data
}
