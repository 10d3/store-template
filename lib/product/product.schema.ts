import { z } from "zod";
import { createMetadataValidator } from "@/lib/metadata/form-utils";

// Base metadata schema - allows any string key-value pairs
const baseMetadataSchema = z.record(z.string(), z.any()).optional();

// Product metadata schema with validation
const productMetadataSchema = baseMetadataSchema.refine(
  createMetadataValidator("product"),
  { message: "Invalid product metadata" }
);

// Coupon metadata schema with validation
const couponMetadataSchema = baseMetadataSchema.refine(
  createMetadataValidator("coupon"),
  { message: "Invalid coupon metadata" }
);

// Price metadata schema with validation
const priceMetadataSchema = baseMetadataSchema.refine(
  createMetadataValidator("price"),
  { message: "Invalid price metadata" }
);

// Checkout metadata schema with validation
const checkoutMetadataSchema = baseMetadataSchema.refine(
  createMetadataValidator("checkout"),
  { message: "Invalid checkout metadata" }
);

// Shipping metadata schema with validation
const shippingMetadataSchema = baseMetadataSchema.refine(
  createMetadataValidator("shipping"),
  { message: "Invalid shipping metadata" }
);

export const productSchema = z.object({
  name: z.string().min(1, "Name is required"),
  price: z.number().min(0, "Price must be positive"),
  currency: z.string().min(1, "Currency is required"), // Required
  id: z.string().optional(),
  description: z.string().optional(),
  images: z.array(z.string()).optional(),
  metadata: productMetadataSchema,
});

export const couponSchema = z.object({
  id: z.string().optional(),
  name: z.string().optional(),
  percent_off: z.number().min(0).max(100).optional(),
  amount_off: z.number().min(0).optional(),
  currency: z.string().min(1, "Currency is required"), // Required
  duration: z.enum(["once", "repeating", "forever"]), // Required
  metadata: couponMetadataSchema,
});

export const packSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Name is required"),
  productIds: z.array(z.string()).min(1, "At least one product required"),
  packPrice: z.number().min(0, "Pack price must be positive"),
  discount: z.number().optional(), // Keep optional
  description: z.string().optional(),
  metadata: productMetadataSchema, // Packs use product metadata + pack-specific fields
});

// Price schema for price-level metadata
export const priceSchema = z.object({
  id: z.string().optional(),
  unit_amount: z.number().min(0, "Price must be positive"),
  currency: z.string().min(1, "Currency is required"),
  product_id: z.string().min(1, "Product ID is required"),
  metadata: priceMetadataSchema,
});

// Checkout session schema for order-level metadata
export const checkoutSchema = z.object({
  line_items: z
    .array(
      z.object({
        price: z.string(),
        quantity: z.number().min(1),
      })
    )
    .min(1, "At least one item required"),
  metadata: checkoutMetadataSchema,
  shipping_address_collection: z
    .object({
      allowed_countries: z.array(z.string()).optional(),
    })
    .optional(),
  shipping_options: z
    .array(
      z.object({
        shipping_rate: z.string(),
      })
    )
    .optional(),
});

// Export metadata schemas for reuse
export {
  productMetadataSchema,
  couponMetadataSchema,
  priceMetadataSchema,
  checkoutMetadataSchema,
  shippingMetadataSchema,
};

export type ProductFormData = z.infer<typeof productSchema>;
export type CouponFormData = z.infer<typeof couponSchema>;
export type PackFormData = z.infer<typeof packSchema>;
export type PriceFormData = z.infer<typeof priceSchema>;
export type CheckoutFormData = z.infer<typeof checkoutSchema>;
