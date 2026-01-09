import type { StripeProduct } from "@/types/product";
import { unstable_cache } from "next/cache";
import { listProductsFromDB } from "./db-queries";
import { listProducts as originalListProducts } from "./crud";
// import { listProductsFromDB } from "@/lib/product/db";
// import { originalListProducts } from "@/lib/product/stripe";
// import type { StripeProduct } from "@/types/stripe";

const USE_DATABASE = true;

/**
 * Cached product list (source of truth)
 */
export const getCachedProducts = unstable_cache(
    async (): Promise<StripeProduct[]> => {
        if (USE_DATABASE) {
            try {
                const products = await listProductsFromDB();
                if (products.length > 0) {
                    return products;
                }
            } catch (error) {
                console.warn(
                    "Database read failed, falling back to Stripe API:",
                    error
                );
            }
        }

        return await originalListProducts();
    },
    ["stripe-products"],
    {
        revalidate: 300,
        tags: ["products"],
    }
);

/**
 * Runtime indexes
 */
let slugIndex: Map<string, StripeProduct[]> | null = null;

/**
 * Build slug index once per runtime
 */
async function buildSlugIndex() {
    const products = await getCachedProducts();
    slugIndex = new Map();

    for (const product of products) {
        const slug = product.metadata?.slug;
        if (!slug) continue;

        if (!slugIndex.has(slug)) {
            slugIndex.set(slug, []);
        }

        slugIndex.get(slug)!.push(product);
    }
}

/**
 * Ensure index exists
 */
async function ensureSlugIndex() {
    if (!slugIndex) {
        await buildSlugIndex();
    }
}

/**
 * Public API — O(1) lookup
 */
export async function getCachedProduct(
    slug: string
): Promise<StripeProduct[]> {
    await ensureSlugIndex();
    return slugIndex!.get(slug) ?? [];
}
