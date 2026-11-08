import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";

export interface DiscountRow {
  id: string;
  code: string;
  active: boolean;
  percentOff: number | null;
  amountOff: number | null;
  currency: string | null;
  duration: string;
  durationInMonths: number | null;
  timesRedeemed: number;
  maxRedemptions: number | null;
  expiresAt: number | null;
  minimumAmount: number | null;
  minimumAmountCurrency: string | null;
}

function couponFrom(code: Stripe.PromotionCode): Stripe.Coupon | null {
  const coupon = code.coupon as unknown;
  return typeof coupon === "object" && coupon !== null
    ? (coupon as Stripe.Coupon)
    : null;
}

export async function listPromotionCodes(): Promise<DiscountRow[]> {
  const stripe = getStripe();
  const codes = await stripe.promotionCodes.list({ limit: 100 });

  return codes.data.map((code) => {
    const coupon = couponFrom(code);
    return {
      id: code.id,
      code: code.code,
      active: code.active,
      percentOff: coupon?.percent_off ?? null,
      amountOff: coupon?.amount_off ?? null,
      currency: coupon?.currency ?? null,
      duration: coupon?.duration ?? "once",
      durationInMonths: coupon?.duration_in_months ?? null,
      timesRedeemed: code.times_redeemed,
      maxRedemptions: code.max_redemptions,
      expiresAt: code.expires_at,
      minimumAmount: code.restrictions.minimum_amount,
      minimumAmountCurrency: code.restrictions.minimum_amount_currency,
    };
  });
}
