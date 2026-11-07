"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { Minus, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useCartStore, cartSubtotal } from "@/lib/cart/store";
import { createCheckoutSession } from "@/lib/checkout";
import { formatMoney } from "@/lib/money";

export function CartView() {
  const [mounted, setMounted] = useState(false);
  const [pending, startTransition] = useTransition();
  const items = useCartStore((state) => state.items);
  const setQuantity = useCartStore((state) => state.setQuantity);
  const removeItem = useCartStore((state) => state.removeItem);

  useEffect(() => setMounted(true), []);

  const subtotal = cartSubtotal(items);

  function checkout() {
    startTransition(async () => {
      const result = await createCheckoutSession(
        items.map((item) => ({
          variantId: item.variantId,
          quantity: item.quantity,
        }))
      );
      if ("url" in result) {
        window.location.href = result.url;
      } else {
        toast.error(result.error);
      }
    });
  }

  if (!mounted) {
    return <div className="h-64 animate-pulse rounded-xl bg-muted" />;
  }

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border p-12 text-center">
        <p className="font-medium">Your cart is empty</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Add a product to get started.
        </p>
        <Button asChild className="mt-6 rounded-full">
          <Link href="/shop">Continue shopping</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_360px]">
      <div className="divide-y divide-border/60">
        {items.map((item) => (
          <div key={item.variantId} className="flex gap-4 py-5 first:pt-0">
            <Link
              href={`/product/${item.productSlug}`}
              className="relative size-24 shrink-0 overflow-hidden rounded-lg bg-muted"
            >
              {item.image ? (
                <Image
                  src={item.image}
                  alt={item.name}
                  fill
                  sizes="96px"
                  className="object-cover"
                />
              ) : null}
            </Link>

            <div className="flex min-w-0 flex-1 flex-col justify-between gap-3">
              <div>
                <Link
                  href={`/product/${item.productSlug}`}
                  className="text-sm font-medium hover:underline"
                >
                  {item.name}
                </Link>
                {item.variantTitle !== "Default" && (
                  <p className="text-sm text-muted-foreground">
                    {item.variantTitle}
                  </p>
                )}
                <p className="mt-1 text-sm">{formatMoney(item.price)}</p>
              </div>

              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center rounded-full border border-border">
                  <button
                    type="button"
                    aria-label="Decrease quantity"
                    className="p-2 disabled:opacity-40"
                    disabled={item.quantity <= 1}
                    onClick={() => setQuantity(item.variantId, item.quantity - 1)}
                  >
                    <Minus className="size-3" />
                  </button>
                  <span className="min-w-6 text-center text-sm">{item.quantity}</span>
                  <button
                    type="button"
                    aria-label="Increase quantity"
                    className="p-2 disabled:opacity-40"
                    disabled={item.quantity >= item.maxQuantity}
                    onClick={() => setQuantity(item.variantId, item.quantity + 1)}
                  >
                    <Plus className="size-3" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => removeItem(item.variantId)}
                  className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
                >
                  <Trash2 className="size-4" />
                  Remove
                </button>
              </div>
            </div>

            <p className="hidden text-sm font-medium sm:block">
              {formatMoney(item.price * item.quantity)}
            </p>
          </div>
        ))}
      </div>

      <aside className="h-fit rounded-xl border border-border/60 p-6">
        <h2 className="font-serif text-xl">Order summary</h2>
        <div className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span>{formatMoney(subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Shipping</span>
            <span>Calculated at checkout</span>
          </div>
          <div className="flex justify-between border-t border-border/60 pt-3 text-base font-medium">
            <span>Total</span>
            <span>{formatMoney(subtotal)}</span>
          </div>
        </div>
        <Button
          type="button"
          size="lg"
          className="mt-6 w-full rounded-full"
          onClick={checkout}
          disabled={pending}
        >
          {pending ? "Redirecting…" : "Checkout"}
        </Button>
        <p className="mt-3 text-center text-xs text-muted-foreground">
          Secure checkout powered by Stripe
        </p>
      </aside>
    </div>
  );
}
