/**
 * lib/catalog/types.ts
 *
 * Pure domain types for the new Product → Variant architecture.
 * These replace the old StripeProduct / ProductVariantData types
 * from types/product.ts and gradually all consumers migrate here.
 */

// ─── Variant ─────────────────────────────────────────────────────────────────

export interface VariantData {
  id: string;
  title: string; // e.g. "Default", "3-Pack", "Black / XL"
  position: number;
  // Pricing (all cents)
  price: number;
  compareAtPrice: number | null;
  cost: number | null;
  // Inventory
  stock: number;
  trackInventory: boolean;
  // Attributes
  options: Record<string, string>; // e.g. { Size: "XL", Color: "Black" }
  sku: string | null;
  image: string | null;
  // Stripe linkage
  stripePriceId: string | null;
  // CJ linkage
  cjVariantId: string | null;
  cjSku: string | null;
  active: boolean;
}

// ─── Bundle ───────────────────────────────────────────────────────────────────

export interface BundleItemData {
  id: string;
  quantity: number;
  position: number;
  componentProduct: {
    id: string;
    name: string;
    slug: string | null;
    images: string[];
  };
  componentVariant: {
    id: string;
    title: string;
    price: number;
    image: string | null;
  } | null;
}

// ─── Product ──────────────────────────────────────────────────────────────────

export interface ProductWithVariants {
  id: string;
  slug: string | null;
  name: string;
  description: string | null;
  subtitle: string | null;
  tagline: string | null;
  images: string[];
  active: boolean;
  category: string | null;
  type: string | null;
  gender: string | null;
  collection: string | null;
  collectionOrder: number | null;
  featured: boolean;
  tags: string[];
  source: string;
  cjProductId: string | null;
  isBundle: boolean;
  nutrition: string | null;
  metadata: Record<string, string> | null;
  // Relations
  variants: VariantData[];
  bundleItems: BundleItemData[]; // only populated for bundle products
  // Computed helpers (resolved server-side for convenience)
  minPrice: number; // lowest variant price in cents
  maxPrice: number; // highest variant price in cents
  defaultVariant: VariantData | null; // first active variant
  createdAt: Date;
  updatedAt: Date;
}

// ─── Input types (for mutations) ──────────────────────────────────────────────

export interface VariantInput {
  title?: string;
  position?: number;
  price: number; // cents
  compareAtPrice?: number | null;
  cost?: number | null;
  stock?: number;
  trackInventory?: boolean;
  options?: Record<string, string>;
  sku?: string | null;
  image?: string | null;
  cjVariantId?: string | null;
  cjSku?: string | null;
}

export interface ProductInput {
  name: string;
  slug?: string;
  description?: string | null;
  subtitle?: string | null;
  tagline?: string | null;
  images?: string[];
  category?: string | null;
  type?: string | null;
  gender?: string | null;
  collection?: string | null;
  collectionOrder?: number | null;
  featured?: boolean;
  tags?: string[];
  isBundle?: boolean;
  nutrition?: string | null;
  metadata?: Record<string, string>;
  // Variants to create along with the product
  variants?: VariantInput[];
}

// ─── Order line item ──────────────────────────────────────────────────────────

export interface OrderLineItemData {
  id: string;
  variantId: string | null;
  productName: string;
  variantTitle: string;
  sku: string | null;
  image: string | null;
  unitPrice: number; // cents
  quantity: number;
  totalPrice: number; // cents
}
