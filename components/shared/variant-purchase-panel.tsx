"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { Minus, Plus, ShoppingCart, CreditCard } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCartStore, type CartItem } from "@/lib/store";
import { useSession } from "@/lib/auth-client";
import {
  createCheckoutSessionNow,
  createGuestCheckoutSessionNow,
} from "@/lib/cart/checkout-session";
import type { ProductVariantData, StripeProduct } from "@/types/product";

function variantLabel(v: ProductVariantData, index: number): string {
  const opts = v.options && Object.keys(v.options).length ? Object.values(v.options) : [];
  if (opts.length) return opts.join(" / ");
  return v.sku || `Option ${index + 1}`;
}

/**
 * Purchase panel for CJ (multi-variant) products. Drives add-to-cart / buy-now
 * from the selected ProductVariant so the cart carries the real `stripePriceId`
 * (required for CJ auto-fulfillment) and respects per-variant stock.
 */
export default function VariantPurchasePanel({
  product,
}: {
  product: StripeProduct;
}) {
  const variants = useMemo(
    () => (product.productVariants ?? []).filter((v) => v.active),
    [product.productVariants]
  );

  const { addOrUpdateItem, isAddingToCart, coupon } = useCartStore();
  const { data: session } = useSession();

  const [selectedId, setSelectedId] = useState(variants[0]?.id);
  const [quantity, setQuantity] = useState(1);
  const [buying, setBuying] = useState(false);

  const selected = variants.find((v) => v.id === selectedId) ?? variants[0];

  if (!selected) return null;

  const tracked = product.trackInventory ?? false;
  const outOfStock = tracked && selected.stock <= 0;
  const maxQty = tracked ? Math.max(selected.stock, 0) : 99;
  const price = selected.unit_amount ?? 0;
  const image = selected.image ?? product.images?.[0] ?? "";

  function buildCartItem(): CartItem {
    return {
      id: product.id,
      variantId: selected.id,
      sku: selected.sku ?? undefined,
      name: product.name,
      image,
      price,
      quantity,
      maxQuantity: maxQty,
      stripePriceId: selected.stripePriceId ?? undefined,
      metadata: selected.options,
    };
  }

  function handleSelect(id: string) {
    setSelectedId(id);
    setQuantity(1);
  }

  function handleAdd() {
    if (outOfStock) return;
    addOrUpdateItem(buildCartItem());
    toast.success("Added to cart");
  }

  async function handleBuyNow() {
    if (outOfStock) return;
    try {
      setBuying(true);
      const item = buildCartItem();
      const url = session?.user
        ? await createCheckoutSessionNow(item, coupon?.id)
        : await createGuestCheckoutSessionNow(item, undefined, coupon?.id);
      if (url) window.location.href = url;
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Checkout failed");
    } finally {
      setBuying(false);
    }
  }

  return (
    <div className="space-y-5">
      {/* Price */}
      <div className="flex items-center gap-3">
        <span className="text-3xl font-bold">${(price / 100).toFixed(2)}</span>
        {tracked &&
          (selected.stock > 0 ? (
            <Badge variant="secondary">{selected.stock} in stock</Badge>
          ) : (
            <Badge variant="destructive">Out of stock</Badge>
          ))}
      </div>

      {/* Variant selector */}
      {variants.length > 1 && (
        <div className="space-y-2">
          <span className="text-sm font-medium text-muted-foreground">
            Options
          </span>
          <div className="flex flex-wrap gap-2">
            {variants.map((v, i) => {
              const disabled = (product.trackInventory ?? false) && v.stock <= 0;
              return (
                <button
                  key={v.id}
                  type="button"
                  disabled={disabled}
                  onClick={() => handleSelect(v.id)}
                  className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                    v.id === selected.id
                      ? "border-primary ring-2 ring-primary"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  {v.image && (
                    <Image
                      src={v.image}
                      alt={variantLabel(v, i)}
                      width={28}
                      height={28}
                      className="rounded object-cover"
                    />
                  )}
                  <span>{variantLabel(v, i)}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Quantity */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          className="rounded-full"
          disabled={quantity <= 1}
          onClick={() => setQuantity((q) => Math.max(1, q - 1))}
        >
          <Minus />
        </Button>
        <span className="w-10 text-center">{quantity}</span>
        <Button
          variant="ghost"
          className="rounded-full"
          disabled={quantity >= maxQty}
          onClick={() => setQuantity((q) => Math.min(maxQty, q + 1))}
        >
          <Plus />
        </Button>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Button
          onClick={handleBuyNow}
          disabled={buying || outOfStock}
          className="w-full py-5 bg-[#73BF44] hover:bg-[#73BF44]/90"
        >
          <CreditCard className="w-5 h-5" />
          {outOfStock ? "Unavailable" : "Buy now"}
        </Button>
        <Button
          onClick={handleAdd}
          disabled={isAddingToCart || outOfStock}
          className="w-full py-5 bg-[#063354] hover:bg-[#063354]/90 dark:bg-white dark:hover:bg-white/90"
        >
          <ShoppingCart className="w-5 h-5" />
          Add to cart
        </Button>
      </div>
    </div>
  );
}
