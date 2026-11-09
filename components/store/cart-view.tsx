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

export interface SavedAddress {
  id: string;
  label: string | null;
  name: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string | null;
  postalCode: string;
  country: string;
  isDefault: boolean;
}

export function CartView({ addresses }: { addresses: SavedAddress[] }) {
  const [mounted, setMounted] = useState(false);
  const [pending, startTransition] = useTransition();
  const [addressId, setAddressId] = useState(
    () =>
      addresses.find((address) => address.isDefault)?.id ??
      addresses[0]?.id ??
      ""
  );
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
        })),
        addressId || undefined
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
      <div className="rounded-3xl border border-dashed bg-card p-12 text-center">
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
              className="relative size-24 shrink-0 overflow-hidden rounded-2xl bg-muted"
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

      <aside className="h-fit rounded-3xl border bg-card p-6 shadow-sm">
        <h2 className="font-serif text-2xl font-light">Order summary</h2>
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

        {addresses.length > 0 && (
          <div className="mt-5 space-y-2">
            <label
              htmlFor="saved-address"
              className="text-xs font-medium text-muted-foreground"
            >
              Shipping address
            </label>
            <select
              id="saved-address"
              value={addressId}
              onChange={(event) => setAddressId(event.target.value)}
              className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
            >
              {addresses.map((address) => (
                <option key={address.id} value={address.id}>
                  {address.label || address.name} — {address.line1}, {address.city}
                </option>
              ))}
            </select>
            <Link
              href="/account/addresses"
              className="inline-block text-xs underline underline-offset-4"
            >
              Manage addresses
            </Link>
          </div>
        )}

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
