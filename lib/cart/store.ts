"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItem {
  variantId: string;
  productId: string;
  productSlug: string;
  name: string;
  variantTitle: string;
  image?: string;
  sku?: string;
  price: number;
  quantity: number;
  maxQuantity: number;
}

interface CartState {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  setQuantity: (variantId: string, quantity: number) => void;
  removeItem: (variantId: string) => void;
  clear: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item, quantity = 1) => {
        const existing = get().items.find((i) => i.variantId === item.variantId);
        const max = Math.max(1, item.maxQuantity || 99);
        if (existing) {
          set({
            items: get().items.map((i) =>
              i.variantId === item.variantId
                ? { ...i, quantity: Math.min(max, i.quantity + quantity) }
                : i
            ),
          });
          return;
        }
        set({
          items: [
            ...get().items,
            { ...item, quantity: Math.min(max, Math.max(1, quantity)) },
          ],
        });
      },
      setQuantity: (variantId, quantity) =>
        set({
          items: get().items.map((i) =>
            i.variantId === variantId
              ? { ...i, quantity: Math.min(i.maxQuantity, Math.max(1, quantity)) }
              : i
          ),
        }),
      removeItem: (variantId) =>
        set({ items: get().items.filter((i) => i.variantId !== variantId) }),
      clear: () => set({ items: [] }),
    }),
    { name: "vitanou-cart" }
  )
);

export function cartSubtotal(items: CartItem[]) {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

export function cartCount(items: CartItem[]) {
  return items.reduce((sum, item) => sum + item.quantity, 0);
}
