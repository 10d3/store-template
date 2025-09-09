"use client";

import React, { useState } from "react";
import { CartAsideContainer } from "./cart-aside-container";
import { useCartStore } from "@/lib/store";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import { createCheckoutSession } from "@/lib/cart/checkout-session";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function CartModal() {
  const [isLoading, setIsLoading] = useState(false);
  const { cart, getTotalPrice, clearCart, getItemCount } = useCartStore();
  const router = useRouter();

  const createCheckoutUrl = async () => {
    setIsLoading(true);
    const session = await createCheckoutSession(cart);
    router.push(session as string);
    setIsLoading(false);
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
                      src={item.image}
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
      </div>
    </CartAsideContainer>
  );
}
