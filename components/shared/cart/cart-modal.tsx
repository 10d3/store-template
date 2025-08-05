'use client'
import React from "react";
import { CartAsideContainer } from "./cart-aside-container";
import { useCartStore } from "@/lib/store";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function CartModal() {
  const { cart, getTotalPrice } = useCartStore();
  console.log(cart);

  // Helper function to safely extract price value
  const getPriceDisplay = (price: unknown) => {
    if (typeof price === 'number') {
      return (price / 100).toFixed(2);
    }
    if (typeof price === 'object' && price && 'unit_amount' in price) {
      const unitAmount = (price as { unit_amount: number }).unit_amount;
      return (unitAmount / 100).toFixed(2);
    }
    return '0.00';
  };
  return (
    <CartAsideContainer>
      <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium">Shopping Cart</h2>
        </div>
        <div className="mt-8">
          <ul role="list" className="-my-6 divide-y divide-neutral-200">
            {cart.map((item) => (
              <li
                key={item.id}
                className="grid grid-cols-[4rem_1fr_max-content] grid-rows-[auto_auto] gap-x-4 gap-y-2 py-6"
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <Image
                        src={item.image}
                        alt={item.name}
                        className="w-16 h-16 rounded-md"
                        width={64}
                        height={64}
                      />
                    </div>
                    <div className="ml-4 flex-1">
                      <p className="text-sm font-medium">
                        {item.name}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-end">
                    <p className="text-sm font-medium">
                      ${getPriceDisplay(item.price)}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <div className="border-t border-neutral-200 px-4 py-6 sm:px-6">
          <div
            id="cart-overlay-description"
            className="flex justify-between text-base font-medium"
          >
            <p>Total</p>
            <p>{getTotalPrice()}</p>
          </div>
          <p className="mt-0.5 text-sm">
            Shipping and taxes are calculated at checkout.
          </p>
          <Button
            asChild={true}
            size={"lg"}
            className="mt-6 w-full rounded-full text-lg"
          >
            <Link href="/cart">Checkout</Link>
          </Button>
        </div>
      </div>
    </CartAsideContainer>
  );
}
