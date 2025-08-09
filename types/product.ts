export interface StripeProduct {
  id: string;
  name: string;
  description?: string | null;
  images?: string[];
  metadata: Record<string, string>;
  default_price?:
    | {
        id: string;
        unit_amount: number | null;
        currency: string;
      }
    | string
    | null;
  active: boolean;
  variants?: StripeProductVariant[];
}

export interface StripeProductVariant {
  id: string;
  name: string;
  description?: string;
  image?: string[];
  price: number;
  currency: string;
  default_price?:
    | {
        id: string;
        unit_amount: number | null;
        currency: string;
      }
    | string
    | null;
  active?: boolean;
  metadata: Record<string, string>;
}

export interface StripeCoupon {
  id: string;
  name?: string | null;
  percent_off?: number | null;
  amount_off?: number | null;
  currency?: string | null;
  duration: string;
  valid: boolean;
  metadata: Record<string, string> | null;
}
