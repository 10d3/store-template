"use client";

import React, { useState } from "react";
import { CartAsideContainer } from "./cart-aside-container";
import { useCartStore } from "@/lib/store";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import { createCheckoutSession, createGuestCheckoutSession } from "@/lib/cart/checkout-session";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useSession } from "@/lib/auth-client";

export default function CartModal() {
  const [isLoading, setIsLoading] = useState(false);
  const [showGuestForm, setShowGuestForm] = useState(false);
  const [guestEmail, setGuestEmail] = useState("");
  const [guestName, setGuestName] = useState("");
  const { cart, getTotalPrice, clearCart, getItemCount } = useCartStore();
  const { data: session } = useSession();
  const router = useRouter();

  const createCheckoutUrl = async () => {
    if (session?.user) {
      try {
        setIsLoading(true);
        const url = await createCheckoutSession(cart);
        router.push(url as string);
      } catch (error: any) {
        toast.error(error.message || "An error occurred during checkout");
        console.error("Error creating checkout session:", error);
      } finally {
        setIsLoading(false);
      }
    } else {
      setShowGuestForm(true);
    }
  };

  const handleGuestCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestEmail) {
      toast.error("Please enter your email");
      return;
    }
    try {
      setIsLoading(true);
      const url = await createGuestCheckoutSession(guestEmail, cart, guestName || undefined);
      router.push(url as string);
    } catch (error: any) {
      toast.error(error.message || "An error occurred during checkout");
      console.error("Error creating guest checkout session:", error);
    } finally {
      setIsLoading(false);
    }
  };
  // const stripeCheckoutSession = useQuery({
  //   queryKey: ["stripe-checkout-session"],
  //   queryFn: async () => {
  //     const session = await createCheckoutSession(cart);
  //     return session;
  //   },
  // });

  // console.log(stripeCheckoutSession.data)

  return (
    <CartAsideContainer>
      <div className="flex h-full flex-col overflow-hidden p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium">Cart ({getItemCount()} items)</h2>
          {cart.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground cursor-pointer"
              onClick={clearCart}
            >
              Clear all
            </Button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto py-6">
          {cart.length === 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              Your cart is empty
            </div>
          ) : (
            <ul className="-my-6 divide-y divide-border">
              {cart.map((item) => (
                <li key={item.id} className="flex py-6">
                  <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border">
                    <Image
                      src={item.image || "/placeholder.svg"}
                      alt={item.name}
                      width={64}
                      height={64}
                      className="h-full w-full object-cover object-center"
                    />
                  </div>
                  <div className="ml-4 flex flex-1 flex-col">
                    <div className="flex justify-between text-sm">
                      <h3 className="font-medium">{item.name}</h3>
                      <p className="ml-4">
                        {formatPrice(
                          typeof item.price === "number" ? item.price : 0
                        )}
                      </p>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Quantity: {item.quantity}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {showGuestForm ? (
          <form onSubmit={handleGuestCheckout} className="border-t border-border pt-6 space-y-4">
            <p className="text-sm text-muted-foreground">Enter your email to checkout as a guest</p>
            <input
              type="email"
              placeholder="Email address"
              value={guestEmail}
              onChange={(e) => setGuestEmail(e.target.value)}
              className="w-full px-4 py-2 border rounded-md"
              required
            />
            <input
              type="text"
              placeholder="Name (optional)"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              className="w-full px-4 py-2 border rounded-md"
            />
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => setShowGuestForm(false)} className="flex-1">
                Back
              </Button>
              <Button type="submit" disabled={isLoading} className="flex-1">
                {isLoading ? <Loader2 className="animate-spin" /> : "Continue"}
              </Button>
            </div>
          </form>
        ) : (
          <div className="border-t border-border pt-6">
            <div className="flex justify-between text-base">
              <p className="font-medium">Subtotal</p>
              <p className="font-medium">{formatPrice(getTotalPrice() * 100)}</p>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Shipping and taxes calculated at checkout
            </p>
            <Button
              onClick={createCheckoutUrl}
              disabled={isLoading}
              size="lg"
              className="mt-6 w-full rounded-full"
            >
              {isLoading ? (
                <Loader2 className="animate-spin" />
              ) : (
                "Proceed to Checkout"
              )}
            </Button>
          </div>
        )}
      </div>
    </CartAsideContainer>
  );
}
