"use client";

import { useEffect } from "react";
import { useCartStore } from "@/lib/cart/store";

export function ClearCart() {
  const clear = useCartStore((state) => state.clear);
  useEffect(() => {
    clear();
  }, [clear]);
  return null;
}
