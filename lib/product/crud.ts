/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";
import Stripe from "stripe";
import {
  CouponFormData,
  PackFormData,
  ProductFormData,
} from "./product.schema";
import type { StripeProduct, StripeCoupon } from "@/types/product";
import { validateMetadata } from "@/lib/metadata/config";
import { transformMetadataForSubmission } from "@/lib/metadata/form-utils";
import { ProductCrudError } from "./errors";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  typescript: true,
});

// Helper function to validate and transform metadata
function validateAndTransformMetadata(
  metadata: Record<string, any> | undefined,
  type: "product" | "price" | "coupon" | "checkout" | "shipping"
): Record<string, string | number | null> {
  if (!metadata) return {};

  const validation = validateMetadata(metadata, type);

  if (!validation.isValid) {
    throw new ProductCrudError(
      `Metadata validation failed: ${validation.errors.join(", ")}`,
      "METADATA_VALIDATION_ERROR",
      { errors: validation.errors }
    );
  }

  // Log warnings if any
  // if (validation.warnings && validation.warnings.length > 0) {
  //   console.warn("Metadata validation warnings:", validation.warnings);
  // }

  return transformMetadataForSubmission(metadata);
}

// Transform Stripe Product to plain object
function transformProduct(product: Stripe.Product): StripeProduct {
  return {
    id: product.id,
    name: product.name,
    description: product.description,
    images: product.images,
    metadata: product.metadata,
    default_price: product.default_price,
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
  try {
    const validatedMetadata = validateAndTransformMetadata(
      data.metadata,
      "product"
    );

    const product = await stripe.products.create({
      name: data.name,
      description: data.description,
      images: data.images,
      metadata: validatedMetadata,
    });

    await stripe.prices.create({
      product: product.id,
      unit_amount: data.price,
      currency: data.currency,
    });

    return transformProduct(product);
  } catch (error) {
    if (error instanceof ProductCrudError) {
      throw error;
    }
    if (error instanceof Stripe.errors.StripeError) {
      throw new ProductCrudError(
        `Stripe error: ${error.message}`,
        "STRIPE_ERROR",
        { stripeError: error }
      );
    }
    throw new ProductCrudError("Failed to create product", "UNKNOWN_ERROR", {
      originalError: error,
    });
  }
}
export async function updateProduct(
  id: string,
  data: Partial<ProductFormData>
) {
  try {
    const validatedMetadata = data.metadata
      ? validateAndTransformMetadata(data.metadata, "product")
      : undefined;

    const product = await stripe.products.update(id, {
      name: data.name,
      description: data.description,
      images: data.images,
      metadata: validatedMetadata,
    });

    return transformProduct(product);
  } catch (error) {
    if (error instanceof ProductCrudError) {
      throw error;
    }
    if (error instanceof Stripe.errors.StripeError) {
      throw new ProductCrudError(
        `Stripe error: ${error.message}`,
        "STRIPE_ERROR",
        { stripeError: error }
      );
    }
    throw new ProductCrudError("Failed to update product", "UNKNOWN_ERROR", {
      originalError: error,
    });
  }
}

export async function archiveProduct(id: string) {
  try {
    const product = await stripe.products.update(id, { active: false });
    return transformProduct(product);
  } catch (error) {
    if (error instanceof Stripe.errors.StripeError) {
      throw new ProductCrudError(
        `Stripe error: ${error.message}`,
        "STRIPE_ERROR",
        { stripeError: error }
      );
    }
    throw new ProductCrudError("Failed to archive product", "UNKNOWN_ERROR", {
      originalError: error,
    });
  }
}

export async function createCoupon(data: CouponFormData) {
  try {
    const validatedMetadata = validateAndTransformMetadata(
      data.metadata,
      "coupon"
    );

    const coupon = await stripe.coupons.create({
      ...data,
      duration: data.duration as Stripe.CouponCreateParams.Duration,
      metadata: validatedMetadata,
    });

    return transformCoupon(coupon);
  } catch (error) {
    if (error instanceof ProductCrudError) {
      throw error;
    }
    if (error instanceof Stripe.errors.StripeError) {
      throw new ProductCrudError(
        `Stripe error: ${error.message}`,
        "STRIPE_ERROR",
        { stripeError: error }
      );
    }
    throw new ProductCrudError("Failed to create coupon", "UNKNOWN_ERROR", {
      originalError: error,
    });
  }
}

export async function updateCoupon(id: string, data: CouponFormData) {
  try {
    const validatedMetadata = data.metadata
      ? validateAndTransformMetadata(data.metadata, "coupon")
      : undefined;

    const coupon = await stripe.coupons.update(id, {
      name: data.name,
      metadata: validatedMetadata,
    });

    return transformCoupon(coupon);
  } catch (error) {
    if (error instanceof ProductCrudError) {
      throw error;
    }
    if (error instanceof Stripe.errors.StripeError) {
      throw new ProductCrudError(
        `Stripe error: ${error.message}`,
        "STRIPE_ERROR",
        { stripeError: error }
      );
    }
    throw new ProductCrudError("Failed to update coupon", "UNKNOWN_ERROR", {
      originalError: error,
    });
  }
}

export async function createPresetCoupon(preset: "4for3" | "15off3") {
  try {
    if (preset === "4for3") {
      const validatedMetadata = validateAndTransformMetadata(
        {
          type: "4for3",
          description: "Buy 3, get cheapest free",
        },
        "coupon"
      );

      const coupon = await stripe.coupons.create({
        name: "4-for-3 Deal",
        duration: "once",
        metadata: validatedMetadata,
        // Note: The actual "cheapest free" logic would be handled in checkout
        amount_off: 0, // Placeholder - actual discount calculated server-side
      });

      return transformCoupon(coupon);
    }

    if (preset === "15off3") {
      const validatedMetadata = validateAndTransformMetadata(
        {
          type: "bulk_discount",
          min_items: "3",
        },
        "coupon"
      );

      const coupon = await stripe.coupons.create({
        name: "15% off 3+ items",
        duration: "once",
        percent_off: 15,
        metadata: validatedMetadata,
      });

      return transformCoupon(coupon);
    }
  } catch (error) {
    if (error instanceof ProductCrudError) {
      throw error;
    }
    if (error instanceof Stripe.errors.StripeError) {
      throw new ProductCrudError(
        `Stripe error: ${error.message}`,
        "STRIPE_ERROR",
        { stripeError: error }
      );
    }
    throw new ProductCrudError(
      "Failed to create preset coupon",
      "UNKNOWN_ERROR",
      { originalError: error }
    );
  }
}

export async function createPack(data: PackFormData) {
  try {
    const packMetadata = {
      type: "bundle",
      contents: data.productIds.join(","),
      discount: data?.discount?.toString() || "0",
      ...data.metadata,
    };

    const validatedMetadata = validateAndTransformMetadata(
      packMetadata,
      "product"
    );

    const product = await stripe.products.create({
      name: data.name,
      description: data.description,
      metadata: validatedMetadata,
    });

    await stripe.prices.create({
      product: product.id,
      unit_amount: data.packPrice,
      currency: "usd",
    });

    return transformProduct(product);
  } catch (error) {
    if (error instanceof ProductCrudError) {
      throw error;
    }
    if (error instanceof Stripe.errors.StripeError) {
      throw new ProductCrudError(
        `Stripe error: ${error.message}`,
        "STRIPE_ERROR",
        { stripeError: error }
      );
    }
    throw new ProductCrudError("Failed to create pack", "UNKNOWN_ERROR", {
      originalError: error,
    });
  }
}

export async function updatePack(id: string, data: PackFormData) {
  try {
    const packMetadata = {
      type: "bundle",
      contents: data.productIds.join(","),
      discount: data?.discount?.toString() || "0",
      ...data.metadata,
    };

    const validatedMetadata = validateAndTransformMetadata(
      packMetadata,
      "product"
    );

    const product = await stripe.products.update(id, {
      name: data.name,
      description: data.description,
      metadata: validatedMetadata,
    });

    // Note: Stripe doesn't allow updating prices directly
    // In a real application, you might want to create a new price and archive the old one
    // For now, we'll just update the product metadata

    return transformProduct(product);
  } catch (error) {
    if (error instanceof ProductCrudError) {
      throw error;
    }
    if (error instanceof Stripe.errors.StripeError) {
      throw new ProductCrudError(
        `Stripe error: ${error.message}`,
        "STRIPE_ERROR",
        { stripeError: error }
      );
    }
    throw new ProductCrudError("Failed to update pack", "UNKNOWN_ERROR", {
      originalError: error,
    });
  }
}

export async function listProducts(): Promise<StripeProduct[]> {
  try {
    const products = await stripe.products.list({
      active: true,
      expand: ["data.default_price"],
      limit: 100,
    });
    return products.data.map(transformProduct);
  } catch (error) {
    if (error instanceof Stripe.errors.StripeError) {
      throw new ProductCrudError(
        `Stripe error: ${error.message}`,
        "STRIPE_ERROR",
        { stripeError: error }
      );
    }
    throw new ProductCrudError("Failed to list products", "UNKNOWN_ERROR", {
      originalError: error,
    });
  }
}

export async function listCoupons(): Promise<StripeCoupon[]> {
  try {
    const coupons = await stripe.coupons.list({ limit: 100 });
    return coupons.data.map(transformCoupon);
  } catch (error) {
    if (error instanceof Stripe.errors.StripeError) {
      throw new ProductCrudError(
        `Stripe error: ${error.message}`,
        "STRIPE_ERROR",
        { stripeError: error }
      );
    }
    throw new ProductCrudError("Failed to list coupons", "UNKNOWN_ERROR", {
      originalError: error,
    });
  }
}
