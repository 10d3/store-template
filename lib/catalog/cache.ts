/**
 * lib/catalog/cache.ts
 *
 * Next.js unstable_cache wrappers for all catalog read queries.
 * Every export here is safe to call from Server Components.
 * Use revalidateTag("catalog") to bust all catalog caches at once.
 */
import { unstable_cache } from "next/cache";
import {
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
} from "./queries";
import type { ProductWithVariants } from "./types";

// Tag used to bust all catalog caches simultaneously.
// Call revalidateTag("catalog") from admin mutations.
export const CATALOG_TAG = "catalog";

// ─── Cached exports ───────────────────────────────────────────────────────────

export const getCachedProducts = unstable_cache(
  async (): Promise<ProductWithVariants[]> => listActiveProducts(),
  ["catalog-products"],
  { revalidate: 300, tags: [CATALOG_TAG, "products"] }
);

export const getCachedBundles = unstable_cache(
  async (): Promise<ProductWithVariants[]> => listBundles(),
  ["catalog-bundles"],
  { revalidate: 300, tags: [CATALOG_TAG, "bundles"] }
);

export const getCachedProduct = unstable_cache(
  async (slug: string): Promise<ProductWithVariants | null> =>
    getProductBySlug(slug),
  ["catalog-product"],
  { revalidate: 300, tags: [CATALOG_TAG, "products"] }
);

export const getCachedProductsByIds = unstable_cache(
  async (ids: string[]): Promise<ProductWithVariants[]> =>
    getProductsByIds(ids),
  ["catalog-products-by-ids"],
  { revalidate: 300, tags: [CATALOG_TAG, "products"] }
);

export const getCachedFeaturedProducts = unstable_cache(
  async (limit = 8): Promise<ProductWithVariants[]> =>
    getFeaturedProducts(limit),
  ["catalog-featured"],
  { revalidate: 300, tags: [CATALOG_TAG, "products", "featured"] }
);

export const getCachedProductsByCollection = unstable_cache(
  async (collectionSlug: string): Promise<ProductWithVariants[]> =>
    getProductsByCollection(collectionSlug),
  ["catalog-collection"],
  { revalidate: 300, tags: [CATALOG_TAG, "products"] }
);

export const getCachedProductsByCategory = unstable_cache(
  async (category: string): Promise<ProductWithVariants[]> =>
    getProductsByCategory(category),
  ["catalog-category"],
  { revalidate: 300, tags: [CATALOG_TAG, "products"] }
);

export const getCachedRelatedProducts = unstable_cache(
  async (productId: string, limit = 4): Promise<ProductWithVariants[]> =>
    getRelatedProducts(productId, limit),
  ["catalog-related"],
  { revalidate: 300, tags: [CATALOG_TAG, "products"] }
);

export const getCachedCollections = unstable_cache(
  async () => getCollections(),
  ["catalog-collections"],
  { revalidate: 600, tags: [CATALOG_TAG] }
);

export const getCachedBundlesForProduct = unstable_cache(
  async (productId: string): Promise<ProductWithVariants[]> =>
    getBundlesForProduct(productId),
  ["catalog-bundles-for-product"],
  { revalidate: 300, tags: [CATALOG_TAG, "bundles"] }
);
