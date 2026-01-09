// import type { StripeProduct } from "@/types/stripe";
import { getCachedProducts } from "@/lib/product/cache";
import { StripeProduct } from "@/types/product";

/**
 * In-memory bundle index:
 * productId -> StripeProduct[]
 */
let bundleIndex: Map<string, StripeProduct[]> | null = null;

/**
 * Build the bundle index once per runtime
 */
async function buildBundleIndex(): Promise<Map<string, StripeProduct[]>> {
    const products = await getCachedProducts();
    const index = new Map<string, StripeProduct[]>();

    for (const product of products) {
        const metadata = product.metadata;
        if (!metadata) continue;
        if (metadata.type !== "bundle") continue;
        if (!metadata.contents) continue;

        const contents = metadata.contents
            .split(",")
            .map((id: string) => id.trim())
            .filter(Boolean);

        for (const productId of contents) {
            if (!index.has(productId)) {
                index.set(productId, []);
            }
            index.get(productId)!.push(product);
        }
    }

    return index;
}

/**
 * Get bundle index (cached in memory)
 */
async function getBundleIndex(): Promise<Map<string, StripeProduct[]>> {
    if (!bundleIndex) {
        bundleIndex = await buildBundleIndex();
    }
    return bundleIndex;
}

/**
 * Public API: get bundles that include a product
 */
export async function getPack(productId: string): Promise<StripeProduct[]> {
    const index = await getBundleIndex();
    return index.get(productId) ?? [];
}
