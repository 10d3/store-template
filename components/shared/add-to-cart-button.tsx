"use client";
import React from "react";
import { Button } from "../ui/button";
import { useCartStore } from "@/lib/store";
import { StripeProduct } from "@/types/product";
import { ShoppingCart } from "lucide-react";

export default function AddToCartButton({
  product,
}: {
  product: StripeProduct;
}) {
  const getPrice = () => {
    if (
      typeof product.default_price === "object" &&
      product.default_price?.unit_amount
    ) {
      return product.default_price.unit_amount;
    }
    return 0; // fallback if no price available
  };
  const { addOrUpdateItem, isAddingToCart } = useCartStore();
  return (
    <div className="space-y-3">
      <Button
        onClick={() =>
          addOrUpdateItem({
            id: product.id,
            name: product.name,
            image: product?.images?.[0] as string,
            price: getPrice(),
            quantity: -1,
            maxQuantity: 10,
            variantId: product.id,
          })
        }
        disabled={isAddingToCart}
        className="w-full h-14 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
      >
        {isAddingToCart ? (
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Adding to Cart...
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" />
            Add to Cart
          </div>
        )}
      </Button>
    </div>
  );
}
