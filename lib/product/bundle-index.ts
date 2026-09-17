import { StripeProduct } from "@/types/product";
import { unstable_cache } from "next/cache";
import { getPacksFromDB } from "./db-queries";
import { getCachedProducts } from "./cache";

const USE_DATABASE = true;

/**
 * Public API: get bundles that include a product
 */
export const getPack = unstable_cache(
    async (productId: string): Promise<StripeProduct[]> => {
        try {
            let bundles: StripeProduct[] = [];
            
            if (USE_DATABASE) {
                bundles = await getPacksFromDB();
            } else {
                const allProducts = await getCachedProducts();
                bundles = allProducts.filter(p => p.metadata?.type === "bundle");
            }
            
            // Filter bundles to only those containing the productId
            return bundles.filter(bundle => {
                const contents = bundle.metadata?.contents;
                if (!contents) return false;
                
                const includedIds = contents
                    .split(",")
                    .map((id: string) => id.trim())
                    .filter(Boolean);
                    
                return includedIds.includes(productId);
            });
        } catch (error) {
            console.error("Error fetching packs:", error);
            return [];
        }
    },
    ["packs-for-product"],
    {
        revalidate: 300,
        tags: ["products"],
    }
);
