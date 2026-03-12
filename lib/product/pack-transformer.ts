import type { StripeProduct, ProductData, PackOption, PricingTier } from "@/types/product";

interface PackSizeConfig {
    size: number;
    enabled: boolean;
    discountPercent?: number;
    fixedPrice?: number; // in cents
    image?: string; // Image URL for this pack size
    stripePriceId?: string; // Stripe Price ID
}

/**
 * Transform a pack (bundle) product from Stripe/DB format to ProductData format
 * for use with the PackCardNew component.
 * 
 * Uses hybrid pricing:
 * - If fixedPrice is set → use it as total price for the pack
 * - Else if baseProduct provided → calculate from basePrice × size × (1 - discountPercent/100)
 * - Else → use bundle's own price as fixed price for single-pack
 */
export function transformPackToProductData(
    pack: StripeProduct,
    baseProduct?: StripeProduct | null
): ProductData | null {
    // Get base unit price from the product (if provided)
    const basePrice = baseProduct ? getUnitPrice(baseProduct) : null;

    // Parse pack_sizes from metadata, or create a default single-pack option
    let packSizes = parsePackSizes(pack.metadata?.pack_sizes);

    // If no pack_sizes configured, create a single "1 Pack" option using the bundle's own price
    if (!packSizes || packSizes.length === 0) {
        const bundlePrice = getBundlePrice(pack);
        if (bundlePrice) {
            // Create a single pack option with the bundle's price as fixed price
            packSizes = [{ size: 1, enabled: true, fixedPrice: bundlePrice }];
        } else {
            console.warn(`No pack sizes and no bundle price found for pack ${pack.id}`);
            return null;
        }
    }

    // Filter to only enabled sizes
    let enabledSizes = packSizes.filter((s) => s.enabled);

    // If no enabled sizes but this is a "fixed" bundle type, create a single-pack option
    if (enabledSizes.length === 0) {
        const bundleType = pack.metadata?.bundle_type;
        const bundlePrice = getBundlePrice(pack);
        const discountPercent = parseInt(pack.metadata?.discount || "0");

        if (bundleType === "fixed" || bundlePrice) {
            // For fixed bundles, use bundle price or calculate from base product with discount
            let fixedPrice: number;

            if (bundlePrice) {
                fixedPrice = bundlePrice;
            } else if (basePrice) {
                // Calculate from base price with discount (assume contents count as quantity)
                const contentCount = pack.metadata?.contents?.split(",").filter(Boolean).length || 1;
                const originalTotal = basePrice * contentCount;
                fixedPrice = Math.round(originalTotal * (1 - discountPercent / 100));
            } else {
                console.warn(`No enabled pack sizes and cannot calculate price for pack ${pack.id}`);
                return null;
            }

            // Create a single "bundle" option
            enabledSizes = [{ size: 1, enabled: true, fixedPrice }];
            // Single-pack option created for fixed bundle
        } else {
            console.warn(`No enabled pack sizes for pack ${pack.id}`);
            return null;
        }
    }

    // Build pack options
    const packOptions: PackOption[] = enabledSizes.map((s) => ({
        value: s.size.toString(),
        label: s.size === 1 ? "Bundle" : `${s.size} Pack`,
    }));

    // Build pricing tiers (onetime only) and images per size
    const onetimePricing: Record<string, PricingTier> = {};
    const imagesPerSize: Record<string, string> = {};
    const defaultImage = pack.images?.[0] || baseProduct?.images?.[0] || "/placeholder.svg";

    // Get bundle-level discount from metadata (for fixed bundles)
    const bundleDiscountPercent = parseInt(pack.metadata?.discount || "0");

    for (const sizeConfig of enabledSizes) {
        const { size, discountPercent, fixedPrice, image } = sizeConfig;

        // Determine pricing based on available data
        let discountedTotal: number;
        let originalTotal: number;
        let pricePerUnit: number;

        if (fixedPrice !== undefined && fixedPrice > 0) {
            // Use fixed price (already in cents) - this is the discounted price
            discountedTotal = fixedPrice;
            pricePerUnit = Math.round(fixedPrice / size);

            // Reverse-calculate original from bundle discount percentage
            // Formula: original = discounted / (1 - discount/100)
            if (bundleDiscountPercent > 0) {
                originalTotal = Math.round(fixedPrice / (1 - bundleDiscountPercent / 100));
            } else if (basePrice) {
                // Fallback to base price calculation
                originalTotal = basePrice * size;
            } else {
                // No discount info, original = discounted
                originalTotal = fixedPrice;
            }
        } else if (basePrice) {
            // Calculate from base price and discount percentage
            originalTotal = basePrice * size;
            const discount = discountPercent || 0;
            discountedTotal = Math.round(originalTotal * (1 - discount / 100));
            pricePerUnit = Math.round(discountedTotal / size);
        } else {
            // No fixed price and no base price - use bundle's own price
            const bundlePrice = getBundlePrice(pack);
            if (!bundlePrice) {
                console.warn(`Cannot determine price for pack ${pack.id} size ${size}`);
                continue;
            }
            discountedTotal = bundlePrice;
            // Reverse-calculate original if we have discount
            if (bundleDiscountPercent > 0) {
                originalTotal = Math.round(bundlePrice / (1 - bundleDiscountPercent / 100));
            } else {
                originalTotal = bundlePrice;
            }
            pricePerUnit = Math.round(bundlePrice / size);
        }

        onetimePricing[size.toString()] = {
            price: pricePerUnit / 100, // Convert cents to dollars for display
            total: discountedTotal / 100,
            original: originalTotal / 100,
            stripePriceId: sizeConfig.stripePriceId, // Pass the stripePriceId
        };

        // Use size-specific image if available, otherwise use default
        let imageUrl = image;

        // If no image explicitly set on pack size, try to find it in the fetched prices
        if (!imageUrl && pack.prices && pack.prices.length > 0) {
            // Primary: match by Stripe Price ID
            const matchedPrice = sizeConfig.stripePriceId
                ? pack.prices.find(p => p.id === sizeConfig.stripePriceId)
                : null;

            if (matchedPrice && matchedPrice.image) {
                imageUrl = matchedPrice.image;
            } else {
                // Fallback: match by pack_size in price metadata
                // Each pack size price has metadata.pack_size = size.toString()
                const fallbackPrice = pack.prices.find(
                    (p: any) => p.metadata?.pack_size === size.toString() && p.image
                );
                if (fallbackPrice) {
                    imageUrl = (fallbackPrice as any).image;
                }
            }
        }

        imagesPerSize[size.toString()] = imageUrl || defaultImage;
    }

    // If no valid pricing was created, bail out
    if (Object.keys(onetimePricing).length === 0) {
        console.warn(`No valid pricing created for pack ${pack.id}`);
        return null;
    }

    return {
        id: pack.id,
        name: pack.name,
        description: pack.description || "",
        // Default image (first enabled size's image or fallback)
        image: defaultImage,
        slug: pack.slug || "",
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
 * Get bundle price in cents from a StripeProduct (for bundles without pack_sizes)
 */
function getBundlePrice(product: StripeProduct): number | null {
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
        // Try to get the base product from pack contents (optional)
        const contentIds = pack.metadata?.contents?.split(",").filter(Boolean) || [];
        const baseProduct = contentIds.length > 0
            ? allProducts.find((p) => p.id === contentIds[0])
            : null;

        // Transform the pack - baseProduct is now optional
        const productData = transformPackToProductData(pack, baseProduct);

        if (productData) {
            results.push(productData);
        }
    }

    return results;
}
