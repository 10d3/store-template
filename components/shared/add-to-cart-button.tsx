"use client";
import { Button } from "../ui/button";
import { useCartStore } from "@/lib/store";
import type { ProductWithVariants } from "@/lib/catalog";
import { ShoppingCart } from "lucide-react";

export default function AddToCartButton({
  product,
  variantId,
}: {
  product: ProductWithVariants;
  variantId?: string;
}) {
  const getPrice = () => {
    return product.defaultVariant?.price ?? 0;
  };

  // CartItem.variantId must always be a real ProductVariant.id — never fall back to product.id.
  const resolvedVariantId = variantId ?? product.variants?.[0]?.id ?? undefined;

  const { addOrUpdateItem, isAddingToCart, getPendingQuantity, resetPendingQuantity } = useCartStore();

  const handleAddToCart = () => {
    if (!resolvedVariantId) {
      console.error(
        "AddToCartButton: cannot add to cart — no ProductVariant.id available for product",
        product.id
      );
      return;
    }
    const quantity = getPendingQuantity(product.id) || 1;
    addOrUpdateItem({
      id: product.id,
      name: product.name,
      image: product?.images?.[0] as string,
      price: getPrice(),
      quantity: quantity,
      maxQuantity: 10,
      variantId: resolvedVariantId,
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
