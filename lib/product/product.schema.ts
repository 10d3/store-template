import { z } from "zod";

export const productSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  price: z.number().int().min(1, "Price must be at least 1 cent"),
  currency: z.string().default("usd"),
  images: z.array(z.url()).optional(),
  metadata: z.record(z.string(), z.string()).optional(),
});

export const couponSchema = z.object({
  id: z.string().optional(),
  name: z.string().optional(),
  percent_off: z.number().min(1).max(100).optional(),
  amount_off: z.number().int().min(1).optional(),
  currency: z.string().default("usd"),
  duration: z.enum(["once", "repeating", "forever"]).default("once"),
});

export const packSchema = z.object({
  name: z.string().min(1, "Pack name is required"),
  description: z.string().optional(),
  priceIds: z.array(z.string()).min(1, "At least one product is required"),
  discount: z.number().min(0).max(100).default(0),
});

export type ProductFormData = z.infer<typeof productSchema>;
export type CouponFormData = z.infer<typeof couponSchema>;
export type PackFormData = z.infer<typeof packSchema>;
