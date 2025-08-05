"use client";

import React from "react";
import { Button } from "../ui/button";
import { Minus, Plus } from "lucide-react";
import { Input } from "../ui/input";
import { useCartStore } from "@/lib/store";
import { StripeProduct } from "@/types/product";

export default function QuantityManagement({
  product,
}: {
  product: StripeProduct;
}) {
  console.log(product);
  const [mounted, setMounted] = React.useState(false);
  const { getItemCount, addOrUpdateItem, setQuantity } =
    useCartStore();

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Extract price from default_price
  const getPrice = () => {
    if (typeof product.default_price === 'object' && product.default_price?.unit_amount) {
      return product.default_price.unit_amount;
    }
    return 0; // fallback if no price available
  };

  return (
    <div className="flex flex-row items-center gap-2">
      <Button
        className="rounded-full cursor-pointer"
        variant="ghost"
        onClick={() => addOrUpdateItem({
          id: product.id,
          name: product.name,
          image: product?.images?.[0] as string,
          price: getPrice(),
          quantity: -1,
          maxQuantity: 10,
          variantId: product.id,
        })}
      >
        <Minus />
      </Button>
      <Input
        className="w-1/10 rounded-full text-center"
        placeholder={mounted ? getItemCount().toString() : "0"}
        value={mounted ? getItemCount() : 0}
        onChange={(e) =>
          setQuantity(product.id, product.id, Number(e.target.value))
        }
      />
      <Button
        className="rounded-full cursor-pointer"
        variant="ghost"
        onClick={() =>
          addOrUpdateItem({
            id: product.id,
            name: product.name,
            image: product?.images?.[0] as string,
            price: getPrice(),
            quantity: 1,
            maxQuantity: 10,
            variantId: product.id,
          })
        }
      >
        <Plus />
      </Button>
    </div>
  );
}
