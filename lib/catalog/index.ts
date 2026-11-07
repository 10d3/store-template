/**
 * lib/catalog/index.ts
 *
 * Unified public API for the catalog layer.
 * All consumers import from here — never import from cache.ts / queries.ts / mutations.ts directly.
 *
 * Usage:
 *   import { getCachedProduct, updateVariant } from "@/lib/catalog";
 */

// ─── Types ────────────────────────────────────────────────────────────────────
export type {
  VariantData,
  BundleItemData,
  ProductWithVariants,
  VariantInput,
  ProductInput,
  OrderLineItemData,
} from "./types";

// ─── Cached reads (Server Components / Route Handlers) ────────────────────────
export {
  CATALOG_TAG,
  getCachedProducts,
  getCachedBundles,
  getCachedProduct,
  getCachedProductsByIds,
  getCachedFeaturedProducts,
  getCachedProductsByCollection,
  getCachedProductsByCategory,
  getCachedRelatedProducts,
  getCachedCollections,
  getCachedBundlesForProduct,
} from "./cache";

// ─── Raw queries (for use inside mutations / Server Actions that need fresh data) ──
export {
  listActiveProducts,
  listBundles,
  getProductBySlug,
  getProductsByIds,
  getFeaturedProducts,
  getProductsByCollection,
  getProductsByCategory,
  getRelatedProducts,
  getCollections,
  getBundlesForProduct,
  toProductWithVariants,
} from "./queries";

// ─── Mutations (Server Actions) ────────────────────────────────────────────────
export {
  createProduct,
  updateProduct,
  archiveProduct,
  createVariant,
  updateVariant,
  archiveVariant,
  reorderVariants,
  addBundleItem,
  removeBundleItem,
} from "./mutations";
