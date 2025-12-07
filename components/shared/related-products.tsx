"use client";

import { cn } from "@/lib/utils";
import { StripeProduct } from "@/types/product";
import ProductCard from "@/components/shared/product-card";

interface RelatedProductsProps {
    products: StripeProduct[];
    title?: string;
    className?: string;
}

export default function RelatedProducts({
    products,
    title = "You May Also Like",
    className,
}: RelatedProductsProps) {
    if (!products || products.length === 0) return null;

    const getProductPrice = (product: StripeProduct): number => {
        if (
            typeof product.default_price === "object" &&
            product.default_price?.unit_amount
        ) {
            return product.default_price.unit_amount;
        }
        return 0;
    };

    const getProductSlug = (product: StripeProduct): string => {
        return product.metadata?.slug || product.id;
    };

    return (
        <section className={cn("py-8", className)}>
            {title && (
                <h2 className="text-2xl font-bold mb-8 text-center">{title}</h2>
            )}

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {products.map((product) => (
                    <ProductCard
                        key={product.id}
                        id={product.id}
                        name={product.name}
                        price={getProductPrice(product)}
                        image={product.images?.[0] || "/placeholder.svg"}
                        slug={getProductSlug(product)}
                        hoverMedia={
                            product.images?.[1]
                                ? {
                                    type: "image" as const,
                                    src: product.images[1],
                                }
                                : undefined
                        }
                        className="hover:scale-105 transition-transform duration-200"
                    />
                ))}
            </div>
        </section>
    );
}
