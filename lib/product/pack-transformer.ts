import type { StripeProduct, ProductData, PackOption, PricingTier } from "@/types/product";

interface PackSizeConfig {
    size: number;
    enabled: boolean;
    discountPercent?: number;
    fixedPrice?: number; // in cents
    image?: string; // Image URL for this pack size
}

/**
 * Transform a pack (bundle) product from Stripe/DB format to ProductData format
 * for use with the PackCardNew component.
 * 
 * Uses hybrid pricing:
 * - If fixedPrice is set → use it as total price for the pack
 * - Else → calculate from basePrice × size × (1 - discountPercent/100)
 */
export function transformPackToProductData(
    pack: StripeProduct,
    baseProduct: StripeProduct
): ProductData | null {
    // Get base unit price from the product
    const basePrice = getUnitPrice(baseProduct);
    if (!basePrice) {
        console.warn(`No base price found for product ${baseProduct.id}`);
        return null;
    }

    // Parse pack_sizes from metadata
    const packSizes = parsePackSizes(pack.metadata?.pack_sizes);
    if (!packSizes || packSizes.length === 0) {
        console.warn(`No pack sizes configured for pack ${pack.id}`);
        return null;
    }

    // Filter to only enabled sizes
    const enabledSizes = packSizes.filter((s) => s.enabled);
    if (enabledSizes.length === 0) {
        console.warn(`No enabled pack sizes for pack ${pack.id}`);
        return null;
    }

    // Build pack options
    const packOptions: PackOption[] = enabledSizes.map((s) => ({
        value: s.size.toString(),
        label: `${s.size} Pack`,
    }));

    // Build pricing tiers (onetime only) and images per size
    const onetimePricing: Record<string, PricingTier> = {};
    const imagesPerSize: Record<string, string> = {};
    const defaultImage = pack.images?.[0] || baseProduct.images?.[0] || "/placeholder.svg";

    for (const sizeConfig of enabledSizes) {
        const { size, discountPercent, fixedPrice, image } = sizeConfig;
        const originalTotal = basePrice * size; // Full price without discount

        let discountedTotal: number;
        let pricePerUnit: number;

        if (fixedPrice !== undefined && fixedPrice > 0) {
            // Use fixed price (already in cents)
            discountedTotal = fixedPrice;
            pricePerUnit = Math.round(fixedPrice / size);
        } else {
            // Calculate from discount percentage
            const discount = discountPercent || 0;
            discountedTotal = Math.round(originalTotal * (1 - discount / 100));
            pricePerUnit = Math.round(discountedTotal / size);
        }

        onetimePricing[size.toString()] = {
            price: pricePerUnit / 100, // Convert cents to dollars for display
            total: discountedTotal / 100,
            original: originalTotal / 100,
        };

        // Use size-specific image if available, otherwise use default
        imagesPerSize[size.toString()] = image || defaultImage;
    }

    return {
        id: pack.id,
        name: pack.name,
        description: pack.description || "",
        // Default image (first enabled size's image or fallback)
        image: defaultImage,
        images: imagesPerSize,
        imageAlt: pack.name,
        packOptions,
        pricing: {
            subscribe: onetimePricing, // Use same pricing for both (simplified to onetime)
            onetime: onetimePricing,
        },
        trustIndicators: [],
    };
}

/**
 * Get unit price in cents from a StripeProduct
 */
function getUnitPrice(product: StripeProduct): number | null {
    if (!product.default_price) return null;

    if (typeof product.default_price === "object" && product.default_price.unit_amount) {
        return product.default_price.unit_amount;
    }

    return null;
}

/**
 * Parse pack_sizes JSON string from metadata
 */
function parsePackSizes(packSizesStr?: string): PackSizeConfig[] | null {
    if (!packSizesStr) return null;

    try {
        const parsed = JSON.parse(packSizesStr);
        if (Array.isArray(parsed)) {
            return parsed as PackSizeConfig[];
        }
    } catch (e) {
        console.error("Failed to parse pack_sizes:", e);
    }

    return null;
}

/**
 * Transform multiple packs with their base products
 */
export async function transformPacksToProductData(
    packs: StripeProduct[],
    allProducts: StripeProduct[]
): Promise<ProductData[]> {
    const results: ProductData[] = [];

    for (const pack of packs) {
        // Get the first product ID from pack contents as the base product
        const contentIds = pack.metadata?.contents?.split(",").filter(Boolean) || [];
        if (contentIds.length === 0) continue;

        const baseProduct = allProducts.find((p) => p.id === contentIds[0]);
        if (!baseProduct) continue;

        const productData = transformPackToProductData(pack, baseProduct);
        if (productData) {
            results.push(productData);
        }
    }

    return results;
}
