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
  const { getItemCount, addOrUpdateItem, setQuantity } =
    useCartStore();
  return (
    <div className="flex flex-row items-center gap-2">
      <Button
        className="rounded-full cursor-pointer"
        onClick={() => addOrUpdateItem({
          id: product.id,
          name: product.name,
          image: product?.images?.[0] as string,
          price: product.default_price as unknown,
          quantity: -1,
          maxQuantity: 10,
          variantId: product.id,
        })}
      >
        <Minus />
      </Button>
      <Input
        type="number"
        className="w-1/10"
        placeholder={getItemCount().toString()}
        value={getItemCount()}
        onChange={(e) =>
          setQuantity(product.id, product.id, Number(e.target.value))
        }
      />
      <Button
        className="rounded-full cursor-pointer"
        onClick={() =>
          addOrUpdateItem({
            id: product.id,
            name: product.name,
            image: product?.images?.[0] as string,
            price: product.default_price as unknown,
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
