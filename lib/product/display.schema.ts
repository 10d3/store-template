import { z } from "zod";

// Enhanced product validation schemas
export const ProductDisplaySchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Product name is required"),
  price: z.number().positive("Price must be positive"),
  originalPrice: z.number().positive().optional(),
  discount: z.number().min(0).max(100).optional(),
  image: z.string().url("Invalid image URL"),
  hoverMedia: z.object({
    type: z.enum(["image", "video"]),
    src: z.string().url("Invalid media URL"),
  }).optional(),
});

export const PackDisplaySchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Pack name is required"),
  products: z.array(ProductDisplaySchema).min(1, "Pack must contain at least one product"),
  bundleDiscount: z.number().min(0).max(100).default(0),
});

// Runtime validation helpers
export function validateProduct(product: unknown) {
  try {
    return ProductDisplaySchema.parse(product);
  } catch (error) {
    console.error("Product validation failed:", error);
    return null;
  }
}

export function validatePack(pack: unknown) {
  try {
    return PackDisplaySchema.parse(pack);
  } catch (error) {
    console.error("Pack validation failed:", error);
    return null;
  }
}

// Type exports
export type ProductDisplay = z.infer<typeof ProductDisplaySchema>;
export type PackDisplay = z.infer<typeof PackDisplaySchema>;