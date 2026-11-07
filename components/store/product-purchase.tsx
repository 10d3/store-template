"use client";

import Image from "next/image";
import { useEffect, useState, useTransition } from "react";
import { ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { StarRating } from "@/components/store/star-rating";
import { useCartStore } from "@/lib/cart/store";
import { createCheckoutSession } from "@/lib/checkout";
import { formatMoney } from "@/lib/money";

interface PurchaseVariant {
  id: string;
  title: string;
  sku: string | null;
  price: number;
  compareAtPrice: number | null;
  stock: number;
  trackInventory: boolean;
  image: string | null;
}

interface PurchaseProduct {
  id: string;
  name: string;
  slug: string;
  images: { url: string; alt: string | null }[];
  variants: PurchaseVariant[];
  rating: number | null;
  reviewCount: number;
}

export function ProductPurchase({ product }: { product: PurchaseProduct }) {
  const [variantId, setVariantId] = useState(product.variants[0]?.id ?? "");
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(
    product.variants[0]?.image ?? product.images[0]?.url ?? ""
  );
  const [pending, startTransition] = useTransition();
  const addItem = useCartStore((state) => state.addItem);

  const variant = product.variants.find((item) => item.id === variantId);
  const soldOut =
    !variant || (variant.trackInventory && variant.stock <= 0);
  const maxQuantity = variant
    ? variant.trackInventory
      ? Math.max(1, variant.stock)
      : 10
    : 1;

  useEffect(() => {
    setQuantity(1);
    if (variant?.image) setSelectedImage(variant.image);
  }, [variant]);

  function addToCart() {
    if (!variant || soldOut) return;
    addItem(
      {
        variantId: variant.id,
        productId: product.id,
        productSlug: product.slug,
        name: product.name,
        variantTitle: variant.title,
        image: variant.image ?? product.images[0]?.url,
        sku: variant.sku ?? undefined,
        price: variant.price,
        maxQuantity,
      },
      quantity
    );
    toast.success("Added to cart");
  }

  function buyNow() {
    if (!variant || soldOut) return;
    startTransition(async () => {
      const result = await createCheckoutSession([
        { variantId: variant.id, quantity },
      ]);
      if ("url" in result) {
        window.location.href = result.url;
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <div className="grid gap-10 md:grid-cols-2">
      <div className="space-y-3">
        <div className="relative aspect-square overflow-hidden rounded-xl bg-muted">
          {selectedImage ? (
            <Image
              src={selectedImage}
              alt={product.name}
              fill
              priority
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              No image
            </div>
          )}
        </div>
        {product.images.length > 1 && (
          <div className="flex gap-2 overflow-x-auto">
            {product.images.map((image) => (
              <button
                key={image.url}
                type="button"
                onClick={() => setSelectedImage(image.url)}
                className={`relative size-16 shrink-0 overflow-hidden rounded-md border ${
                  selectedImage === image.url
                    ? "border-foreground"
                    : "border-transparent"
                }`}
              >
                <Image
                  src={image.url}
                  alt={image.alt ?? product.name}
                  fill
                  sizes="64px"
                  className="object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-6">
        <div>
          <h1 className="font-serif text-3xl leading-tight sm:text-4xl">
            {product.name}
          </h1>
          {product.reviewCount > 0 && (
            <StarRating
              rating={product.rating ?? 0}
              count={product.reviewCount}
              className="mt-2"
            />
          )}
          {variant && (
            <div className="mt-3 flex items-center gap-3">
              <span className="text-xl font-medium">
                {formatMoney(variant.price)}
              </span>
              {variant.compareAtPrice &&
                variant.compareAtPrice > variant.price && (
                  <span className="text-muted-foreground line-through">
                    {formatMoney(variant.compareAtPrice)}
                  </span>
                )}
            </div>
          )}
        </div>

        {product.variants.length > 1 && (
          <div className="space-y-2">
            <label htmlFor="variant" className="text-sm font-medium">
              Option
            </label>
            <select
              id="variant"
              value={variantId}
              onChange={(event) => setVariantId(event.target.value)}
              className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
            >
              {product.variants.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.title}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="space-y-2">
          <label htmlFor="quantity" className="text-sm font-medium">
            Quantity
          </label>
          <select
            id="quantity"
            value={quantity}
            onChange={(event) => setQuantity(Number(event.target.value))}
            className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
            disabled={soldOut}
          >
            {Array.from({ length: maxQuantity }, (_, index) => index + 1).map(
              (value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              )
            )}
          </select>
          {variant && (
            <p className="text-sm text-muted-foreground">
              {soldOut
                ? "Out of stock"
                : variant.trackInventory && variant.stock <= 5
                  ? `Only ${variant.stock} left`
                  : "In stock"}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            type="button"
            size="lg"
            className="flex-1 rounded-full"
            onClick={addToCart}
            disabled={soldOut}
          >
            <ShoppingBag className="mr-2 size-4" />
            Add to cart
          </Button>
          <Button
            type="button"
            size="lg"
            variant="outline"
            className="flex-1 rounded-full"
            onClick={buyNow}
            disabled={soldOut || pending}
          >
            {pending ? "Starting…" : "Buy now"}
          </Button>
        </div>

        <p className="text-sm leading-relaxed text-muted-foreground">
          Free shipping over $50. Secure checkout with Stripe. 30-day returns.
        </p>
      </div>
    </div>
  );
}
