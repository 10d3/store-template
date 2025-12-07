"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { StripeProduct } from "@/types/product";

interface ProductCollectionProps {
    title: string;
    description?: string;
    products: StripeProduct[];
    collectionSlug?: string;
    showViewAll?: boolean;
    columns?: 2 | 3 | 4;
    className?: string;
}

export default function ProductCollection({
    title,
    description,
    products,
    collectionSlug,
    showViewAll = true,
    columns = 4,
    className,
}: ProductCollectionProps) {
    if (!products || products.length === 0) return null;

    const formatPrice = (amount: number) => {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
        }).format(amount / 100);
    };

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

    const gridCols = {
        2: "grid-cols-2",
        3: "grid-cols-2 md:grid-cols-3",
        4: "grid-cols-2 md:grid-cols-4",
    };

    return (
        <section className={cn("py-12", className)}>
            {/* Header */}
            <div className="flex items-end justify-between mb-8">
                <div>
                    <h2 className="text-3xl font-bold">{title}</h2>
                    {description && (
                        <p className="text-muted-foreground mt-2 max-w-2xl">{description}</p>
                    )}
                </div>
                {showViewAll && collectionSlug && (
                    <Link href={`/collections/${collectionSlug}`}>
                        <Button variant="ghost" className="gap-2">
                            View All
                            <ArrowRight className="w-4 h-4" />
                        </Button>
                    </Link>
                )}
            </div>

            {/* Product Grid */}
            <div className={cn("grid gap-6", gridCols[columns])}>
                {products.map((product) => (
                    <Link
                        key={product.id}
                        href={`/product/${getProductSlug(product)}`}
                        className="group"
                    >
                        <Card className="overflow-hidden border-0 shadow-sm hover:shadow-xl transition-all duration-300">
                            <div className="relative aspect-square bg-gray-100 overflow-hidden">
                                <Image
                                    src={product.images?.[0] || "/placeholder.svg"}
                                    alt={product.name}
                                    fill
                                    className="object-cover group-hover:scale-110 transition-transform duration-500"
                                    sizes={`(max-width: 768px) 50vw, ${100 / columns}vw`}
                                />
                                {product.metadata?.featured === "true" && (
                                    <Badge className="absolute top-3 left-3 bg-primary text-white">
                                        Featured
                                    </Badge>
                                )}
                                {product.metadata?.collection === "sale" && (
                                    <Badge className="absolute top-3 right-3 bg-red-500 text-white">
                                        Sale
                                    </Badge>
                                )}
                            </div>
                            <CardContent className="p-4">
                                <h3 className="font-medium text-base line-clamp-2 group-hover:text-primary transition-colors">
                                    {product.name}
                                </h3>
                                {product.description && (
                                    <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                                        {product.description}
                                    </p>
                                )}
                                <p className="text-xl font-bold mt-2">
                                    {formatPrice(getProductPrice(product))}
                                </p>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>

            {/* Mobile View All Button */}
            {showViewAll && collectionSlug && (
                <div className="mt-8 text-center md:hidden">
                    <Link href={`/collections/${collectionSlug}`}>
                        <Button variant="outline" className="w-full">
                            View All {title}
                        </Button>
                    </Link>
                </div>
            )}
        </section>
    );
}
