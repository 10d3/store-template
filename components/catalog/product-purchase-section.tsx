"use client";

/**
 * components/catalog/product-purchase-section.tsx
 *
 * Unified purchase panel — replaces the old
 * `usePanel ? <VariantPurchasePanel /> : <AddToCartButton />` split.
 *
 * Routing logic:
 *   • 1 variant titled "Default"  → simple add-to-cart (no selector)
 *   • Multiple variants           → variant selector + add-to-cart / buy now
 *   • isBundle                    → bundle component list + add-to-cart
 */
import { useMemo, useState } from "react";
import Image from "next/image";
import { Minus, Plus, ShoppingCart, CreditCard, Package, Share2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCartStore, type CartItem } from "@/lib/store";
import { useSession } from "@/lib/auth-client";
import {
  createCheckoutSessionNow,
  createGuestCheckoutSessionNow,
} from "@/lib/cart/checkout-session";
import type { ProductWithVariants, VariantData } from "@/lib/catalog";

// ─── helpers ─────────────────────────────────────────────────────────────────

function variantLabel(v: VariantData): string {
  const opts = Object.values(v.options ?? {});
  if (opts.length) return opts.join(" / ");
  return v.title || v.sku || "Default";
}

function formatPrice(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

// ─── Simple (single Default variant) ─────────────────────────────────────────

function SimpleAddToCart({
  product,
  variant,
}: {
  product: ProductWithVariants;
  variant: VariantData;
}) {
  const {
    addOrUpdateItem,
    isAddingToCart,
    getPendingQuantity,
    setPendingQuantity,
    resetPendingQuantity,
  } = useCartStore();

  const quantity = getPendingQuantity(product.id);
  const outOfStock = Boolean(variant.trackInventory && variant.stock <= 0);

  function handleAdd() {
    const qty = getPendingQuantity(product.id) || 1;
    addOrUpdateItem({
      id: product.id,
      variantId: variant.id,
      name: product.name,
      variantTitle: variant.title,
      image: variant.image ?? product.images[0] ?? "",
      price: variant.price,
      quantity: qty,
      maxQuantity: variant.trackInventory ? Math.max(variant.stock, 0) : 99,
    });
    resetPendingQuantity(product.id);
    toast.success("Added to cart");
  }

  function decrement() {
    setPendingQuantity(product.id, Math.max(1, quantity - 1));
  }

  function increment() {
    setPendingQuantity(product.id, quantity + 1);
  }

  async function handleShare() {
    if (typeof window === "undefined") return;
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: product.name, url });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(url);
        toast.success("Link copied to clipboard");
      }
    } catch {
      // Sharing cancelled or unavailable — no-op.
    }
  }

  return (
    <div className="flex items-center gap-3" id="button-add-to-cart">
      <div className="flex h-12 shrink-0 items-center rounded-full border border-border bg-background px-1">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Decrease quantity"
          onClick={decrement}
          disabled={quantity <= 1}
          className="h-9 w-9 rounded-full"
        >
          <Minus className="h-4 w-4" />
        </Button>
        <span className="w-8 text-center text-sm font-medium tabular-nums">
          {quantity.toString().padStart(2, "0")}
        </span>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Increase quantity"
          onClick={increment}
          className="h-9 w-9 rounded-full"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <Button
        onClick={handleAdd}
        disabled={isAddingToCart || outOfStock}
        className="h-12 flex-1 rounded-full py-0 font-semibold shadow-none bg-[#063354] hover:bg-[#063354]/90 dark:bg-white dark:hover:bg-white/90"
      >
        {outOfStock ? (
          "Out of stock"
        ) : isAddingToCart ? (
          <div className="flex items-center gap-2">
            <span>Adding to Cart</span>
            <div className="w-5 h-5 border-2 border-[#0b2239]/30 border-t-[#0b2239] rounded-full animate-spin" />
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" />
            <span>Add to Cart</span>
          </div>
        )}
      </Button>

      <Button
        type="button"
        variant="outline"
        aria-label="Share product"
        onClick={handleShare}
        className="h-12 w-12 shrink-0 rounded-full p-0"
      >
        <Share2 className="w-5 h-5" />
      </Button>
    </div>
  );
}

// ─── Multi-variant selector ───────────────────────────────────────────────────

function MultiVariantPanel({ product }: { product: ProductWithVariants }) {
  const variants = useMemo(
    () => product.variants.filter((v) => v.active),
    [product.variants]
  );

  const { addOrUpdateItem, isAddingToCart, coupon } = useCartStore();
  const { data: session } = useSession();

  const [selectedId, setSelectedId] = useState(variants[0]?.id ?? "");
  const [quantity, setQuantity] = useState(1);
  const [buying, setBuying] = useState(false);

  const selected = variants.find((v) => v.id === selectedId) ?? variants[0];
  if (!selected) return null;

  const outOfStock = selected.trackInventory && selected.stock <= 0;
  const maxQty = selected.trackInventory ? Math.max(selected.stock, 0) : 99;

  function buildCartItem(): CartItem {
    return {
      id: product.id,
      variantId: selected.id,
      sku: selected.sku ?? undefined,
      name: product.name,
      variantTitle: selected.title,
      image: selected.image ?? product.images[0] ?? "",
      price: selected.price,
      quantity,
      maxQuantity: maxQty,
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
        <span className="text-3xl font-bold">{formatPrice(selected.price)}</span>
        {selected.compareAtPrice && (
          <span className="text-lg text-muted-foreground line-through">
            {formatPrice(selected.compareAtPrice)}
          </span>
        )}
        {selected.trackInventory &&
          (selected.stock > 0 ? (
            <Badge variant="secondary">{selected.stock} in stock</Badge>
          ) : (
            <Badge variant="destructive">Out of stock</Badge>
          ))}
      </div>

      {/* Variant selector */}
      <div className="space-y-2">
        <span className="text-sm font-medium text-muted-foreground">Options</span>
        <div className="flex flex-wrap gap-2">
          {variants.map((v) => {
            const disabled = v.trackInventory && v.stock <= 0;
            return (
              <button
                key={v.id}
                type="button"
                disabled={disabled}
                onClick={() => handleSelect(v.id)}
                className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${v.id === selected.id
                  ? "border-primary ring-2 ring-primary"
                  : "border-border hover:border-primary/50"
                  }`}
              >
                {v.image && (
                  <Image
                    src={v.image}
                    alt={variantLabel(v)}
                    width={28}
                    height={28}
                    className="rounded object-cover"
                  />
                )}
                <span>{variantLabel(v)}</span>
              </button>
            );
          })}
        </div>
      </div>

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

// ─── Bundle display ───────────────────────────────────────────────────────────

function BundlePanel({ product }: { product: ProductWithVariants }) {
  const defaultVariant = product.defaultVariant;
  const { addOrUpdateItem, isAddingToCart } = useCartStore();

  function handleAdd() {
    if (!defaultVariant) return;
    addOrUpdateItem({
      id: product.id,
      variantId: defaultVariant.id,
      name: product.name,
      variantTitle: "Bundle",
      image: product.images[0] ?? "",
      price: defaultVariant.price,
      quantity: 1,
      maxQuantity: 99,
    });
    toast.success("Bundle added to cart");
  }

  return (
    <div className="space-y-5">
      {defaultVariant && (
        <div className="flex items-center gap-3">
          <span className="text-3xl font-bold">{formatPrice(defaultVariant.price)}</span>
          {defaultVariant.compareAtPrice && (
            <span className="text-lg text-muted-foreground line-through">
              {formatPrice(defaultVariant.compareAtPrice)}
            </span>
          )}
        </div>
      )}

      {/* Bundle components list */}
      {product.bundleItems.length > 0 && (
        <div className="space-y-2">
          <span className="text-sm font-medium text-muted-foreground flex items-center gap-1">
            <Package className="w-4 h-4" /> What's included
          </span>
          <ul className="space-y-2">
            {product.bundleItems
              .sort((a, b) => a.position - b.position)
              .map((item) => (
                <li key={item.id} className="flex items-center gap-3 text-sm">
                  {item.componentProduct.images[0] && (
                    <Image
                      src={item.componentProduct.images[0]}
                      alt={item.componentProduct.name}
                      width={36}
                      height={36}
                      className="rounded object-cover border"
                    />
                  )}
                  <span className="flex-1">{item.componentProduct.name}</span>
                  <Badge variant="outline">×{item.quantity}</Badge>
                </li>
              ))}
          </ul>
        </div>
      )}

      <Button
        onClick={handleAdd}
        disabled={isAddingToCart || !defaultVariant}
        className="w-full py-5 bg-[#063354] hover:bg-[#063354]/90 dark:bg-white dark:hover:bg-white/90"
      >
        <ShoppingCart className="w-5 h-5" />
        Add bundle to cart
      </Button>
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

/**
 * Drop-in for any product page.
 * Automatically picks the right UI based on the product shape.
 */
export default function ProductPurchaseSection({
  product,
}: {
  product: ProductWithVariants;
}) {
  const activeVariants = product.variants.filter((v) => v.active);

  // Bundle product
  if (product.isBundle) {
    return <BundlePanel product={product} />;
  }

  // Single default variant — no selector needed
  if (
    activeVariants.length === 1 &&
    (activeVariants[0].title === "Default" || Object.keys(activeVariants[0].options).length === 0)
  ) {
    return <SimpleAddToCart product={product} variant={activeVariants[0]} />;
  }

  // Multiple variants (sizes, pack counts, colors…)
  return <MultiVariantPanel product={product} />;
}
