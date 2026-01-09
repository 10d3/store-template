// import type { StripeProduct } from "@/types/stripe";
import { getCachedProducts } from "@/lib/product/cache";
import { StripeProduct } from "@/types/product";

/**
 * Indexes
 */
let productByIdIndex: Map<string, StripeProduct> | null = null;
let categoryIndex: Map<string, StripeProduct[]> | null = null;
let explicitRelatedIndex: Map<string, string[]> | null = null;

/**
 * Build all indexes once per runtime
 */
async function buildIndexes() {
    const products = await getCachedProducts();

    productByIdIndex = new Map();
    categoryIndex = new Map();
    explicitRelatedIndex = new Map();

    for (const product of products) {
        productByIdIndex.set(product.id, product);

        const metadata = product.metadata ?? {};

        /** Category index */
        if (metadata.category && metadata.type !== "bundle") {
            if (!categoryIndex.has(metadata.category)) {
                categoryIndex.set(metadata.category, []);
            }
            categoryIndex.get(metadata.category)!.push(product);
        }

        /** Explicit related products index */
        if (metadata.related_products) {
            const relatedIds = metadata.related_products
                .split(",")
                .map((id: string) => id.trim())
                .filter(Boolean);

            explicitRelatedIndex.set(product.id, relatedIds);
        }
    }
}

/**
 * Ensure indexes exist
 */
async function ensureIndexes() {
    if (!productByIdIndex || !categoryIndex || !explicitRelatedIndex) {
        await buildIndexes();
    }
}

/**
 * Public API
 */
export async function getRelatedProducts(
    productId: string,
    limit: number = 4
): Promise<StripeProduct[]> {
    try {
        await ensureIndexes();

        const product = productByIdIndex!.get(productId);
        if (!product) return [];

        /** 1️⃣ Explicit related products (highest priority) */
        const explicitIds = explicitRelatedIndex!.get(productId);
        if (explicitIds?.length) {
            const explicitProducts = explicitIds
                .map((id) => productByIdIndex!.get(id))
                .filter(
                    (p): p is StripeProduct =>
                        Boolean(p) && p?.id !== productId
                );

            if (explicitProducts.length) {
                return explicitProducts.slice(0, limit);
            }
        }

        /** 2️⃣ Same category fallback */
        const category = product.metadata?.category;
        if (category && categoryIndex!.has(category)) {
            return categoryIndex!
                .get(category)!
                .filter((p) => p.id !== productId)
                .slice(0, limit);
        }

        return [];
    } catch (error) {
        console.error("Error fetching related products:", error);
        return [];
    }
}
