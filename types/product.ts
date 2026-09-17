export interface StripeProduct {
  id: string;
  name: string;
  description?: string | null;
  images?: string[];
  slug?: string
  subtitle?: string | null;
  tagline?: string | null;
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
  prices?: {
    id: string;
    unit_amount: number | null;
    currency: string;
    is_default: boolean;
    image?: string | null;
    metadata?: Record<string, string>;
  }[];

  // Catalog source ("MANUAL" | "CJ") and real per-product variants (DB model).
  source?: string;
  trackInventory?: boolean;
  productVariants?: ProductVariantData[];
}

// A real product variant from the ProductVariant table (size/color/option + inventory).
export interface ProductVariantData {
  id: string;
  stripePriceId: string | null;
  sku: string | null;
  options: Record<string, string>;
  stock: number;
  cost: number | null;
  image: string | null;
  active: boolean;
  unit_amount: number | null; // resolved from the linked Price
  currency: string;
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

export interface PackOption {
  value: string
  label: string
}

export interface PricingTier {
  price: number
  total: number
  original: number
  stripePriceId?: string
}

export interface PricingData {
  subscribe: Record<string, PricingTier>
  onetime: Record<string, PricingTier>
}

export interface TrustIndicator {
  value: string
  label: string
}

export interface ProductData {
  id: string
  name: string
  description: string
  slug: string
  image: string // Default/fallback image
  images: Record<string, string> // Images per pack size, keyed by size (e.g., "2", "3")
  imageAlt: string
  packOptions: PackOption[]
  pricing: PricingData
  trustIndicators: TrustIndicator[]
  subscriptionBenefits?: string[]
}

export type PurchaseType = "subscribe" | "onetime"
