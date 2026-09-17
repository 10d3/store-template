/**
 * Single source of truth for collection display metadata.
 * Used by /collections (index) and /collections/[slug] (detail).
 */
export const COLLECTION_NAMES: Record<
    string,
    { name: string; description: string }
> = {
    "new-arrivals": {
        name: "New Arrivals",
        description: "Check out our latest products, fresh off the shelf",
    },
    "best-sellers": {
        name: "Best Sellers",
        description: "Our most popular products loved by customers",
    },
    "summer-essentials": {
        name: "Summer Essentials",
        description: "Everything you need for the perfect summer",
    },
    "gift-ideas": {
        name: "Gift Ideas",
        description: "Perfect presents for any occasion",
    },
    sale: {
        name: "Sale",
        description: "Great products at amazing prices",
    },
};

/** Resolve display info for any slug, with graceful title-case fallback. */
export function getCollectionDisplay(slug: string): {
    name: string;
    description: string;
} {
    const known = COLLECTION_NAMES[slug];
    if (known) return known;
    const name = slug
        .replace(/-/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());
    return {
        name,
        description: `Browse our ${name} collection`,
    };
}
