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
  const [mounted, setMounted] = React.useState(false);
  const { getPendingQuantity, setPendingQuantity } = useCartStore();

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const quantity = getPendingQuantity(product.id);

  const handleDecrement = () => {
    setPendingQuantity(product.id, quantity - 1);
  };

  const handleIncrement = () => {
    setPendingQuantity(product.id, quantity + 1);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value);
    if (!isNaN(value)) {
      setPendingQuantity(product.id, value);
    }
  };

  return (
    <div className="flex flex-col gap-3 w-full">
      <div className="flex flex-row items-center gap-2">
        <Button
          className="rounded-full cursor-pointer"
          variant="ghost"
          disabled={quantity <= 1}
          onClick={handleDecrement}
        >
          <Minus />
        </Button>
        <Input
          className="md:w-1/10 rounded-full text-center"
          placeholder={mounted ? quantity.toString() : "1"}
          value={mounted ? quantity : 1}
          onChange={handleInputChange}
        />
        <Button
          className="rounded-full cursor-pointer"
          variant="ghost"
          disabled={quantity >= 10}
          onClick={handleIncrement}
        >
          <Plus />
        </Button>
      </div>
    </div>
  );
}
