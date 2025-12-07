"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Plus, Minus, ShoppingCart } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/lib/store";
import { StripeProduct } from "@/types/product";

interface TierConfig {
    min: number;
    percent: number;
}

interface CustomBundleBuilderProps {
    bundleId: string;
    bundleName: string;
    products: StripeProduct[];
    pricingType: "percentage" | "tiered" | "fixed_price";
    fixedDiscountPercent?: number;
    fixedBundlePrice?: number;
    tierConfig?: TierConfig[];
    minItems: number;
    maxItems: number;
    className?: string;
}

export default function CustomBundleBuilder({
    bundleId,
    bundleName,
    products,
    pricingType,
    fixedDiscountPercent = 0,
    fixedBundlePrice = 0,
    tierConfig = [],
    minItems,
    maxItems,
    className,
}: CustomBundleBuilderProps) {
    const [selectedItems, setSelectedItems] = React.useState<Map<string, number>>(new Map());
    const { addBundleAsPack } = useCartStore();

    const formatPrice = (cents: number) => {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
        }).format(cents / 100);
    };

    const getProductPrice = (product: StripeProduct): number => {
        if (typeof product.default_price === "object" && product.default_price?.unit_amount) {
            return product.default_price.unit_amount;
        }
        return 0;
    };

    const totalItemCount = Array.from(selectedItems.values()).reduce((sum, qty) => sum + qty, 0);

    const calculateSubtotal = (): number => {
        let total = 0;
        selectedItems.forEach((qty, productId) => {
            const product = products.find((p) => p.id === productId);
            if (product) {
                total += getProductPrice(product) * qty;
            }
        });
        return total;
    };

    const calculateFinalPrice = (): number => {
        const subtotal = calculateSubtotal();

        switch (pricingType) {
            case "percentage":
                return Math.round(subtotal * (1 - fixedDiscountPercent / 100));

            case "tiered":
                // Find applicable tier (highest matching min)
                const sortedTiers = [...tierConfig].sort((a, b) => b.min - a.min);
                const tier = sortedTiers.find((t) => totalItemCount >= t.min);
                if (tier) {
                    return Math.round(subtotal * (1 - tier.percent / 100));
                }
                return subtotal;

            case "fixed_price":
                return fixedBundlePrice;

            default:
                return subtotal;
        }
    };

    const getCurrentDiscount = (): number => {
        switch (pricingType) {
            case "percentage":
                return fixedDiscountPercent;
            case "tiered":
                const sortedTiers = [...tierConfig].sort((a, b) => b.min - a.min);
                const tier = sortedTiers.find((t) => totalItemCount >= t.min);
                return tier?.percent || 0;
            case "fixed_price":
                const subtotal = calculateSubtotal();
                if (subtotal > 0) {
                    return Math.round(((subtotal - fixedBundlePrice) / subtotal) * 100);
                }
                return 0;
            default:
                return 0;
        }
    };

    const addItem = (productId: string) => {
        if (totalItemCount >= maxItems) return;
        setSelectedItems((prev) => {
            const newMap = new Map(prev);
            newMap.set(productId, (prev.get(productId) || 0) + 1);
            return newMap;
        });
    };

    const removeItem = (productId: string) => {
        setSelectedItems((prev) => {
            const newMap = new Map(prev);
            const current = prev.get(productId) || 0;
            if (current <= 1) {
                newMap.delete(productId);
            } else {
                newMap.set(productId, current - 1);
            }
            return newMap;
        });
    };

    const canAddToCart = totalItemCount >= minItems;
    const subtotal = calculateSubtotal();
    const finalPrice = calculateFinalPrice();
    const savings = subtotal - finalPrice;
    const currentDiscount = getCurrentDiscount();

    const handleAddToCart = () => {
        if (!canAddToCart) return;

        const bundleItems = Array.from(selectedItems.entries()).flatMap(([productId, qty]) => {
            const product = products.find((p) => p.id === productId);
            if (!product) return [];
            return [{
                id: product.id,
                name: product.name,
                price: getProductPrice(product),
                quantity: qty,
                maxQuantity: 99,
                image: product.images?.[0] || "",
                stripePriceId: typeof product.default_price === "object" ? product.default_price?.id : undefined,
            }];
        });

        addBundleAsPack({
            id: `custom_${bundleId}_${Date.now()}`,
            name: `Custom ${bundleName}`,
            price: finalPrice,
            image: products[0]?.images?.[0] || "",
            quantity: 1,
            maxQuantity: 10,
            items: bundleItems,
            discount: currentDiscount,
            originalPrice: subtotal,
            discountType: "percent",
        });

        // Reset selection
        setSelectedItems(new Map());
    };

    return (
        <Card className={cn("w-full", className)}>
            <CardHeader>
                <CardTitle className="flex items-center justify-between">
                    <span>{bundleName}</span>
                    <Badge variant="secondary">
                        Pick {minItems === maxItems ? minItems : `${minItems}-${maxItems}`} items
                    </Badge>
                </CardTitle>
                {pricingType === "tiered" && tierConfig.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                        {tierConfig.map((tier) => (
                            <Badge
                                key={tier.min}
                                variant={totalItemCount >= tier.min ? "default" : "outline"}
                                className="text-xs"
                            >
                                {tier.min}+ items: {tier.percent}% off
                            </Badge>
                        ))}
                    </div>
                )}
            </CardHeader>

            <CardContent className="space-y-6">
                {/* Product Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {products.map((product) => {
                        const qty = selectedItems.get(product.id) || 0;
                        const isSelected = qty > 0;

                        return (
                            <div
                                key={product.id}
                                className={cn(
                                    "relative rounded-lg border-2 overflow-hidden transition-all cursor-pointer",
                                    isSelected
                                        ? "border-primary ring-2 ring-primary/20"
                                        : "border-gray-200 hover:border-gray-300"
                                )}
                            >
                                {/* Product Image */}
                                <div className="relative aspect-square">
                                    <Image
                                        src={product.images?.[0] || "/placeholder.svg"}
                                        alt={product.name}
                                        fill
                                        className="object-cover"
                                        sizes="(max-width: 768px) 50vw, 25vw"
                                    />
                                    {isSelected && (
                                        <div className="absolute top-2 right-2">
                                            <Badge className="bg-primary text-white">
                                                <Check className="w-3 h-3 mr-1" />
                                                {qty}
                                            </Badge>
                                        </div>
                                    )}
                                </div>

                                {/* Product Info */}
                                <div className="p-3">
                                    <h4 className="font-medium text-sm line-clamp-1">{product.name}</h4>
                                    <p className="text-muted-foreground text-sm">
                                        {formatPrice(getProductPrice(product))}
                                    </p>

                                    {/* Quantity Controls */}
                                    <div className="flex items-center justify-between mt-2">
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            className="h-8 w-8"
                                            onClick={() => removeItem(product.id)}
                                            disabled={qty === 0}
                                        >
                                            <Minus className="w-4 h-4" />
                                        </Button>
                                        <span className="font-medium">{qty}</span>
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            className="h-8 w-8"
                                            onClick={() => addItem(product.id)}
                                            disabled={totalItemCount >= maxItems}
                                        >
                                            <Plus className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Summary */}
                <div className="border-t pt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                        <span>Items selected:</span>
                        <span className={cn(!canAddToCart && "text-red-500")}>
                            {totalItemCount} / {minItems} min
                        </span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span>Subtotal:</span>
                        <span className="line-through text-muted-foreground">{formatPrice(subtotal)}</span>
                    </div>
                    {savings > 0 && (
                        <div className="flex justify-between text-sm text-green-600">
                            <span>You save ({currentDiscount}%):</span>
                            <span>-{formatPrice(savings)}</span>
                        </div>
                    )}
                    <div className="flex justify-between font-bold text-lg">
                        <span>Total:</span>
                        <span>{formatPrice(finalPrice)}</span>
                    </div>
                </div>

                {/* Add to Cart Button */}
                <Button
                    className="w-full h-12"
                    onClick={handleAddToCart}
                    disabled={!canAddToCart}
                >
                    <ShoppingCart className="w-5 h-5 mr-2" />
                    {canAddToCart
                        ? `Add Bundle to Cart - ${formatPrice(finalPrice)}`
                        : `Select ${minItems - totalItemCount} more item${minItems - totalItemCount > 1 ? "s" : ""}`}
                </Button>
            </CardContent>
        </Card>
    );
}
