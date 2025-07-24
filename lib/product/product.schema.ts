import { z } from "zod";

export const productSchema = z.object({
  name: z.string().min(1, "Name is required"),
  price: z.number().min(0, "Price must be positive"),
  currency: z.string().min(1, "Currency is required"), // Required
  id: z.string().optional(),
  description: z.string().optional(),
  images: z.array(z.string()).optional(),
  metadata: z.record(z.string(), z.string()).optional(),
});

export const couponSchema = z.object({
  id: z.string().optional(),
  name: z.string().optional(),
  percent_off: z.number().min(0).max(100).optional(),
  amount_off: z.number().min(0).optional(),
  currency: z.string().min(1, "Currency is required"), // Required
  duration: z.enum(["once", "repeating", "forever"]), // Required
})

export const packSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Name is required"),
  productIds: z.array(z.string()).min(1, "At least one product required"),
  packPrice: z.number().min(0, "Pack price must be positive"),
  discount: z.number().optional(), // Keep optional
  description: z.string().optional(),
})

export type ProductFormData = z.infer<typeof productSchema>;
export type CouponFormData = z.infer<typeof couponSchema>;
export type PackFormData = z.infer<typeof packSchema>;
