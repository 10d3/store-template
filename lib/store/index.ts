/* eslint-disable @typescript-eslint/no-explicit-any */
import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItem {
  id: string;
  variantId?: string;                  // e.g. "42-red-XL"
  sku?: string;                        // optional human sku
  name: string;
  image: string;
  price: number;                       // unit price in cents
  quantity: number;
  maxQuantity: number;                 // stock limit
  stripePriceId?: string;              // ← NEW: pass to Checkout
  metadata?: Record<string, any>;      // ← NEW: pack_size, group, …
}

export interface CartCoupon {
  id: string;                          // coupon id or promo code
  type: "percent" | "fixed";
  value: number;                       // percent_off or amount_off (cents)
  metadata?: Record<string, any>;      // campaign, tier, …
}

interface CartStore {
  cart: CartItem[];
  coupon?: CartCoupon | null;

  addOrUpdateItem: (
    item: Omit<CartItem, "quantity"> & { quantity?: number }
  ) => void;
  setQuantity: (id: string, variantId?: string, quantity?: number) => void;
  removeItem: (id: string, variantId?: string) => void;
  clearCart: () => void;

  addBundle: (items: CartItem[]) => void;                // pre-defined bundle
  addVirtualBundle: (stripePriceId: string, qty: number) => void; // virtual
  applyCoupon: (coupon: CartCoupon) => void;
  removeCoupon: () => void;

  getItemCount: () => number;
  getSubTotal: () => number;            // before coupon
  getTotalPrice: () => number;          // after coupon
  getTotalUniqueItems: () => number;

  loadServerCart: (items: CartItem[]) => void;
}

const STORAGE_KEY = "shop-cart";

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      cart: [],
      coupon: null,

      addOrUpdateItem: (incoming) => {
        const { id, variantId = "", quantity = 1 } = incoming;
        set((s) => {
          const idx = s.cart.findIndex(
            (i) => i.id === id && i.variantId === variantId
          );
          const cart = [...s.cart];
          if (idx >= 0) {
            const item = cart[idx]!;
            item.quantity = Math.min(
              item.quantity + quantity,
              item.maxQuantity
            );
          } else {
            cart.push({
              ...incoming,
              quantity: Math.min(quantity, incoming.maxQuantity),
            });
          }
          return { cart };
        });
      },

      setQuantity: (id, variantId = "", qty) => {
        if (!qty || qty < 1) {
          get().removeItem(id, variantId);
          return;
        }
        set((s) => ({
          cart: s.cart.map((i) =>
            i.id === id && i.variantId === variantId
              ? { ...i, quantity: Math.min(qty, i.maxQuantity) }
              : i
          ),
        }));
      },

      removeItem: (id, variantId = "") =>
        set((s) => ({
          cart: s.cart.filter((i) => !(i.id === id && i.variantId === variantId)),
        })),

      clearCart: () => set({ cart: [], coupon: null }),

      /* Pre-defined bundle (adds multiple items at once) */
      addBundle: (items) =>
        set((s) => {
          const next = [...s.cart];
          items.forEach((it) => {
            const idx = next.findIndex(
              (i) => i.id === it.id && i.variantId === it.variantId
            );
            if (idx >= 0) {
              next[idx]!.quantity = Math.min(
                next[idx]!.quantity + it.quantity,
                next[idx]!.maxQuantity
              );
            } else {
              next.push({ ...it });
            }
          });
          return { cart: next };
        }),

      /* Virtual bundle – single Price ID represents the whole pack */
      addVirtualBundle: (stripePriceId, qty) => {
        /* You can map the Price ID to a known virtual bundle item */
        const virtualItem: CartItem = {
          id: "test",                                // virtual placeholder
          name: "Mystery Coffee 3-Pack",
          image: "/images/mystery.png",
          price: 2400,                           // fetch from Stripe
          quantity: qty,
          maxQuantity: 100,
          stripePriceId,
          metadata: { type: "virtual_bundle" },
        };
        get().addOrUpdateItem(virtualItem);
      },

      applyCoupon: (coupon) => set({ coupon }),
      removeCoupon: () => set({ coupon: null }),

      getItemCount: () =>
        get().cart.reduce((sum, i) => sum + i.quantity, 0),

      getSubTotal: () =>
        get().cart.reduce((sum, i) => sum + i.price * i.quantity, 0),

      getTotalPrice: () => {
        const sub = get().getSubTotal();
        const { coupon } = get();
        if (!coupon) return Number((sub / 100).toFixed(2));

        const discount =
          coupon.type === "percent"
            ? (coupon.value / 100) * sub
            : coupon.value;
        const total = Math.max(sub - discount, 0);
        return Number((total / 100).toFixed(2));
      },

      getTotalUniqueItems: () => get().cart.length,

      loadServerCart: (items) => set({ cart: items }),
    }),
    {
      name: STORAGE_KEY,
      partialize: (state) => ({
        cart: state.cart,
        coupon: state.coupon,
      }),
    }
  )
);