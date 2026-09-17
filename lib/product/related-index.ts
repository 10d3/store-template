import { StripeProduct } from "@/types/product";
import { unstable_cache } from "next/cache";
import { getProductsByIdsFromDB, getProductsByCategoryFromDB } from "./db-queries";
import { getCachedProducts } from "./cache";

const USE_DATABASE = true;

/**
 * Public API - Fetches related products directly from the DB
 */
export const getRelatedProducts = unstable_cache(
    async (productId: string, limit: number = 4): Promise<StripeProduct[]> => {
        try {
            if (USE_DATABASE) {
                // First get the target product to check its metadata
                const [product] = await getProductsByIdsFromDB([productId]);
                if (!product) return [];

                const metadata = product.metadata ?? {};

                // 1️⃣ Explicit related products (highest priority)
                if (metadata.related_products) {
                    const explicitIds = metadata.related_products
                        .split(",")
                        .map((id: string) => id.trim())
                        .filter(Boolean);

                    if (explicitIds.length > 0) {
                        const explicitProducts = await getProductsByIdsFromDB(explicitIds);
                        const validProducts = explicitProducts.filter(p => p.id !== productId);
                        if (validProducts.length > 0) {
                            return validProducts.slice(0, limit);
                        }
                    }
                }

                // 2️⃣ Same category fallback
                const category = metadata.category;
                if (category && metadata.type !== "bundle") {
                    const categoryProducts = await getProductsByCategoryFromDB(category);
                    return categoryProducts
                        .filter(p => p.id !== productId)
                        .slice(0, limit);
                }

                return [];
            } else {
                // Fallback to fetch all and filter if DB fails or is disabled
                const allProducts = await getCachedProducts();
                const product = allProducts.find(p => p.id === productId);
                if (!product) return [];

                const metadata = product.metadata ?? {};
                if (metadata.related_products) {
                    const explicitIds = metadata.related_products.split(",").map((id: string) => id.trim());
                    const explicitProducts = allProducts.filter(p => explicitIds.includes(p.id) && p.id !== productId);
                    if (explicitProducts.length > 0) return explicitProducts.slice(0, limit);
                }

                if (metadata.category && metadata.type !== "bundle") {
                    return allProducts
                        .filter(p => p.metadata?.category === metadata.category && p.id !== productId)
                        .slice(0, limit);
                }

                return [];
            }
        } catch (error) {
            console.error("Error fetching related products:", error);
            return [];
        }
    },
    ["related-products"],
    {
        revalidate: 300,
        tags: ["products"],
    }
);
