"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowRight,
  Loader2,
  Minus,
  Package,
  Plus,
  ShoppingBag,
  Trash2,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  createCheckoutSession,
  createGuestCheckoutSession,
} from "@/lib/cart/checkout-session";
import { useCartStore, type CartItem } from "@/lib/store";
import { formatPrice } from "@/lib/utils";
import { useSession } from "@/lib/auth-client";

export default function CartPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  const { cart, coupon, getSubTotal, clearCart, removeItem, setQuantity } =
    useCartStore();

  // zustand persist rehydrates after mount — avoid flashing the empty state
  useEffect(() => {
    setMounted(true);
  }, []);

  const subtotal = mounted ? getSubTotal() : 0; // cents

  const handleCheckout = async () => {
    try {
      setIsLoading(true);
      if (session?.user) {
        const url = await createCheckoutSession(cart, coupon?.id);
        router.push(url as string);
      } else {
        const url = await createGuestCheckoutSession(cart, undefined, coupon?.id);
        router.push(url as string);
      }
    } catch (error: any) {
      toast.error(error.message || "An error occurred during checkout");
      console.error("Error creating checkout session:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const changeQty = (item: CartItem, delta: number) => {
    const next = item.quantity + delta;
    setQuantity(item.id, item.variantId ?? "", next < 1 ? undefined : next);
    // setQuantity removes the line when qty is falsy (<1)
  };

  /* ---------- Hydrating ---------- */
  if (!mounted) {
    return (
      <div className="container mx-auto max-w-5xl px-4 py-12">
        <div className="h-9 w-48 animate-pulse rounded-md bg-muted" />
        <div className="mt-8 space-y-4">
          {[0, 1].map((i) => (
            <div key={i} className="flex gap-4">
              <div className="h-24 w-24 animate-pulse rounded-lg bg-muted" />
              <div className="flex-1 space-y-3 py-2">
                <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
                <div className="h-4 w-1/3 animate-pulse rounded bg-muted" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  /* ---------- Empty state ---------- */
  if (cart.length === 0) {
    return (
      <div className="container mx-auto max-w-xl px-4 py-20 md:py-28">
        <div className="flex flex-col items-center text-center">
          <div className="flex size-16 items-center justify-center rounded-full bg-muted">
            <ShoppingBag className="size-7 text-muted-foreground" />
          </div>
          <h1 className="mt-6 text-2xl font-semibold tracking-tight md:text-3xl">
            Your cart is empty
          </h1>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            Looks like you haven&apos;t added anything yet. Browse our
            collections to find something you love.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" className="rounded-full">
              <Link href="/collections">Browse Collections</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="rounded-full"
            >
              <Link href="/">Back to Home</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  /* ---------- Cart ---------- */
  return (
    <div className="container mx-auto max-w-6xl px-4 py-10 md:py-14">
      {/* Header */}
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
            Your Cart
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {cart.reduce((acc, i) => acc + i.quantity, 0)}{" "}
            {cart.length === 1 ? "item" : "items"}
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={clearCart}
          className="text-muted-foreground hover:text-foreground cursor-pointer"
        >
          Clear all
        </Button>
      </div>

      <div className="grid gap-10 lg:grid-cols-[1fr_360px]">
        {/* Items */}
        <ul className="divide-y divide-border">
          {cart.map((item) => {
            const isBundle = item.metadata?.type === "bundle";
            return (
              <li key={`${item.id}-${item.variantId ?? ""}`} className="flex gap-4 py-6 first:pt-0 sm:gap-6">
                <Link
                  href={`/product/${item.id}`}
                  className="relative block h-20 w-20 shrink-0 overflow-hidden rounded-lg border bg-muted sm:h-24 sm:w-24"
                >
                  <Image
                    src={item.image || "/placeholder.svg"}
                    alt={item.name}
                    fill
                    sizes="96px"
                    className="object-cover object-center"
                  />
                </Link>

                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <Link
                        href={`/product/${item.id}`}
                        className="line-clamp-2 font-medium leading-snug hover:underline"
                      >
                        {item.name}
                      </Link>
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        {isBundle && (
                          <Badge variant="secondary" className="text-xs">
                            Bundle
                          </Badge>
                        )}
                        {item.sku && (
                          <span className="text-xs text-muted-foreground">
                            SKU: {item.sku}
                          </span>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {formatPrice(item.price)} each
                        </span>
                      </div>
                    </div>
                    <p className="shrink-0 font-semibold tabular-nums">
                      {formatPrice(item.price * item.quantity)}
                    </p>
                  </div>

                  <div className="mt-auto flex items-center justify-between pt-4">
                    {/* Quantity stepper */}
                    <div className="inline-flex items-center rounded-full border">
                      <button
                        type="button"
                        aria-label={`Decrease quantity of ${item.name}`}
                        onClick={() => changeQty(item, -1)}
                        disabled={isLoading}
                        className="flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                      >
                        <Minus className="size-3.5" />
                      </button>
                      <span className="w-8 text-center text-sm font-medium tabular-nums">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        aria-label={`Increase quantity of ${item.name}`}
                        onClick={() => changeQty(item, +1)}
                        disabled={isLoading || item.quantity >= item.maxQuantity}
                        title={
                          item.quantity >= item.maxQuantity
                            ? "Maximum available quantity reached"
                            : undefined
                        }
                        className="flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                      >
                        <Plus className="size-3.5" />
                      </button>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeItem(item.id, item.variantId ?? "")}
                      disabled={isLoading}
                      aria-label={`Remove ${item.name} from cart`}
                      className="text-muted-foreground hover:text-destructive cursor-pointer gap-1.5"
                    >
                      <Trash2 className="size-4" />
                      <span className="hidden sm:inline">Remove</span>
                    </Button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>

        {/* Summary */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <Card>
            <CardContent className="space-y-5 p-6">
              <h2 className="font-semibold tracking-tight">Order Summary</h2>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium tabular-nums">
                    {formatPrice(subtotal)}
                  </span>
                </div>
                {coupon && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">
                      Coupon{" "}
                      <Badge variant="secondary" className="ml-1 text-xs">
                        {coupon.id}
                      </Badge>
                    </span>
                    <span className="text-xs text-muted-foreground">
                      applied at checkout
                    </span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between text-base font-semibold">
                  <span>Estimated total</span>
                  <span className="tabular-nums">{formatPrice(subtotal)}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Shipping, taxes and discounts calculated at checkout.
                </p>
              </div>

              <Button
                onClick={handleCheckout}
                disabled={isLoading || cart.length === 0}
                size="lg"
                className="w-full cursor-pointer rounded-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="animate-spin" />
                    Redirecting…
                  </>
                ) : (
                  <>
                    Proceed to Checkout
                    <ArrowRight className="size-4" />
                  </>
                )}
              </Button>

              <Button
                asChild
                variant="ghost"
                size="sm"
                className="w-full text-muted-foreground cursor-pointer"
              >
                <Link href="/collections">
                  <Package className="size-4" />
                  Continue shopping
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
