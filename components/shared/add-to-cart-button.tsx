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

  const { addOrUpdateItem, isAddingToCart, getPendingQuantity, resetPendingQuantity } = useCartStore();

  const handleAddToCart = () => {
    const quantity = getPendingQuantity(product.id);
    addOrUpdateItem({
      id: product.id,
      name: product.name,
      image: product?.images?.[0] as string,
      price: getPrice(),
      quantity: quantity,
      maxQuantity: 10,
      variantId: product.id,
    });
    // Reset the pending quantity after adding to cart
    resetPendingQuantity(product.id);
  };

  return (
    <div className="space-y-3" id="button-add-to-cart">
      <Button
        onClick={handleAddToCart}
        disabled={isAddingToCart}
        className="w-full py-5 bg-[#063354] hover:bg-[#063354]/90 dark:bg-white dark:hover:bg-white/90 shadow-lg hover:shadow-xl transition-all duration-300"
      >
        {isAddingToCart ? (
          <div className="flex items-center gap-2">
            <h3>Adding to Cart</h3>
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" />
            <h3>Add to Cart</h3>
          </div>
        )}
      </Button>
    </div>
  );
}
