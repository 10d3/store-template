"use server";

/**
 * lib/coupons.ts
 *
 * Server-only coupon operations. Ported from the legacy `lib/product/crud.ts`
 * coupon section so behavior (Stripe Coupons API, metadata validation, error
 * wrapping) is preserved exactly. Coupons are Stripe-only — there is no Coupon
 * Prisma model.
 */
import Stripe from "stripe";
import { headers } from "next/headers";
import { validateMetadata } from "@/lib/metadata/config";
import { transformMetadataForSubmission } from "@/lib/metadata/form-utils";
import { ProductCrudError } from "@/lib/product/errors";
import { auth } from "@/lib/auth";
import type { CouponFormData } from "@/lib/product/product.schema";

export type Coupon = {
  id: string;
  name?: string | null;
  percent_off?: number | null;
  amount_off?: number | null;
  currency?: string | null;
  duration: string;
  valid: boolean;
  metadata?: Record<string, string> | null;
};

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  typescript: true,
});

async function requireAdmin() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user || session.user.role !== "admin") {
    throw new Error("Unauthorized");
  }
}

function validateAndTransformMetadata(
  metadata: Record<string, unknown> | undefined,
  type: "product" | "price" | "coupon" | "checkout" | "shipping"
): Record<string, string | number | null> {
  if (!metadata) return {};

  const validation = validateMetadata(metadata as Record<string, string>, type);

  if (!validation.isValid) {
    throw new ProductCrudError(
      `Metadata validation failed: ${validation.errors.join(", ")}`,
      "METADATA_VALIDATION_ERROR",
      { errors: validation.errors }
    );
  }

  return transformMetadataForSubmission(metadata);
}

function transformCoupon(coupon: Stripe.Coupon): Coupon {
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

export async function createCoupon(data: CouponFormData): Promise<Coupon> {
  try {
    await requireAdmin();
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

export async function updateCoupon(
  id: string,
  data: CouponFormData
): Promise<Coupon> {
  try {
    await requireAdmin();
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

export async function listCoupons(): Promise<Coupon[]> {
  const coupons = await stripe.coupons.list({ limit: 100 });
  return coupons.data.map(transformCoupon);
}

export async function createPresetCoupon(
  preset: "4for3" | "15off3"
): Promise<Coupon> {
  try {
    await requireAdmin();
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

    throw new ProductCrudError("Unknown coupon preset", "UNKNOWN_PRESET", {
      preset,
    });
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
