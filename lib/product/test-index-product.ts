import type { StripeProduct } from "@/types/product";
import { unstable_cache } from "next/cache";
import { listProductsFromDB, getProductBySlugFromDB } from "./db-queries";
import { listProducts as originalListProducts } from "./crud";

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
 * Public API — O(1) database lookup cached via Next.js unstable_cache
 */
export const getCachedProduct = unstable_cache(
    async (slug: string): Promise<StripeProduct[]> => {
        if (USE_DATABASE) {
            try {
                const products = await getProductBySlugFromDB(slug);
                if (products.length > 0) {
                    return products;
                }
            } catch (error) {
                console.error("Failed to fetch product by slug from DB:", error);
            }
        }
        
        // Fallback to fetch all and filter if DB fails or is disabled
        const allProducts = await getCachedProducts();
        return allProducts.filter(p => p.metadata?.slug === slug || p.slug === slug);
    },
    ["product-by-slug"],
    {
        revalidate: 300,
        tags: ["products"],
    }
);
