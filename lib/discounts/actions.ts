"use server";

import { revalidatePath } from "next/cache";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { requireAdminAction } from "@/lib/session";
import { dollarsToCents } from "@/lib/money";

export interface DiscountState {
  error?: string;
  success?: string;
}

export async function createDiscount(
  _state: DiscountState,
  formData: FormData
): Promise<DiscountState> {
  await requireAdminAction();

  const code = String(formData.get("code") ?? "").trim().toUpperCase();
  const type = String(formData.get("type") ?? "percent");
  const value = Number(formData.get("value"));
  const duration = String(formData.get("duration") ?? "once");
  const durationMonths = Number(formData.get("durationInMonths") ?? 0);
  const maxRedemptionsRaw = String(formData.get("maxRedemptions") ?? "").trim();
  const maxRedemptions = maxRedemptionsRaw
    ? Number.parseInt(maxRedemptionsRaw, 10)
    : undefined;
  const expiresAtRaw = String(formData.get("expiresAt") ?? "").trim();
  const minimumAmountRaw =
    String(formData.get("minimumAmount") ?? "").trim() || "0";
  const minimumAmount = dollarsToCents(minimumAmountRaw);

  if (!/^[A-Z0-9_-]{3,40}$/.test(code)) {
    return {
      error:
        "Code must be 3–40 characters: letters, numbers, hyphens or underscores.",
    };
  }
  if (type !== "percent" && type !== "amount") {
    return { error: "Choose a valid discount type." };
  }
  if (!Number.isFinite(value) || value <= 0) {
    return { error: "Enter a discount value greater than zero." };
  }
  if (type === "percent" && value > 100) {
    return { error: "Percentage discounts cannot exceed 100%." };
  }
  if (!["once", "forever", "repeating"].includes(duration)) {
    return { error: "Choose a valid duration." };
  }
  if (
    duration === "repeating" &&
    (!Number.isInteger(durationMonths) ||
      durationMonths < 1 ||
      durationMonths > 12)
  ) {
    return { error: "Repeating discounts must last 1–12 months." };
  }
  if (minimumAmount === null) {
    return { error: "Enter a valid minimum order amount." };
  }
  if (
    maxRedemptions !== undefined &&
    (!Number.isInteger(maxRedemptions) || maxRedemptions < 1)
  ) {
    return { error: "Maximum redemptions must be a positive whole number." };
  }

  let expiresAt: number | undefined;
  if (expiresAtRaw) {
    const date = new Date(`${expiresAtRaw}T23:59:59`);
    if (Number.isNaN(date.getTime()) || date.getTime() <= Date.now()) {
      return { error: "Expiry must be a future date." };
    }
    expiresAt = Math.floor(date.getTime() / 1000);
  }

  const currency = (process.env.STRIPE_CURRENCY ?? "usd").toLowerCase();
  const amountOff = type === "amount" ? dollarsToCents(value) : null;
  if (type === "amount" && (!amountOff || amountOff < 1)) {
    return { error: "Enter a valid discount amount." };
  }

  try {
    const stripe = getStripe();
    const coupon = await stripe.coupons.create({
      name: code,
      percent_off: type === "percent" ? value : undefined,
      amount_off: amountOff ?? undefined,
      currency: type === "amount" ? currency : undefined,
      duration: duration as Stripe.CouponCreateParams.Duration,
      duration_in_months: duration === "repeating" ? durationMonths : undefined,
      max_redemptions: maxRedemptions,
      redeem_by: expiresAt,
    });

    await stripe.promotionCodes.create({
      coupon: coupon.id,
      code,
      active: true,
      expires_at: expiresAt,
      max_redemptions: maxRedemptions,
      restrictions:
        minimumAmount > 0
          ? {
              minimum_amount: minimumAmount,
              minimum_amount_currency: currency,
            }
          : undefined,
    });

    revalidatePath("/admin/discounts");
    return { success: `Discount ${code} is live.` };
  } catch (error) {
    console.error("[discounts] create failed:", error);
    return {
      error:
        error instanceof Error
          ? error.message
          : "Could not create the discount code.",
    };
  }
}

export async function toggleDiscount(formData: FormData) {
  await requireAdminAction();
  const id = String(formData.get("id") ?? "");
  const active = formData.get("active") === "true";
  if (!id) throw new Error("Missing promotion code id.");

  await getStripe().promotionCodes.update(id, { active });
  revalidatePath("/admin/discounts");
}
