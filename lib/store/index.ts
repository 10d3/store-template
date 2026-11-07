/* eslint-disable @typescript-eslint/no-explicit-any */
import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItem {
  id: string;         // Product ID
  variantId: string;  // Required — must be a real ProductVariant.id
  sku?: string;
  name: string;
  variantTitle?: string;   // e.g. "Default", "3-Pack", "Black / XL"
  image: string;
  price: number;      // unit price in cents
  quantity: number;
  maxQuantity: number;
  metadata?: Record<string, any>;
}

export interface CartCoupon {
  id: string; // coupon id or promo code
  type: "percent" | "fixed";
  value: number; // percent_off or amount_off (cents)
  metadata?: Record<string, any>; // campaign, tier, …
}

interface CartStore {
  cart: CartItem[];
  coupon?: CartCoupon | null;
  pendingQuantity: Record<string, number>; // productId -> quantity (for quantity selector)

  addOrUpdateItem: (
    item: Omit<CartItem, "quantity"> & { quantity?: number }
  ) => void;
  setQuantity: (id: string, variantId?: string, quantity?: number) => void;
  removeItem: (id: string, variantId?: string) => void;
  clearCart: () => void;

  addBundle: (items: CartItem[]) => void; // pre-defined bundle
  applyCoupon: (coupon: CartCoupon) => void;
  removeCoupon: () => void;

  getItemCountById: (id: string) => number;
  getItemCountByVariantId: (id: string, variantId?: string) => number;
  getItemCount: () => number;
  getSubTotal: () => number; // before coupon
  getTotalPrice: () => number; // after coupon
  getTotalUniqueItems: () => number;
  isAddingToCart: boolean;

  // Pending quantity management (for quantity selector before adding to cart)
  getPendingQuantity: (productId: string) => number;
  setPendingQuantity: (productId: string, quantity: number) => void;
  resetPendingQuantity: (productId: string) => void;

  loadServerCart: (items: CartItem[]) => void;
}

const STORAGE_KEY = "shop-cart";

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      cart: [],
      coupon: null,
      isAddingToCart: false,
      pendingQuantity: {},

      getPendingQuantity: (productId) => get().pendingQuantity[productId] || 1,

      setPendingQuantity: (productId, quantity) =>
        set((s) => ({
          pendingQuantity: {
            ...s.pendingQuantity,
            [productId]: Math.max(1, Math.min(quantity, 10)),
          },
        })),

      resetPendingQuantity: (productId) =>
        set((s) => {
          const { [productId]: _, ...rest } = s.pendingQuantity;
          return { pendingQuantity: rest };
        }),

      addOrUpdateItem: (incoming) => {
        const { id, variantId, quantity = 1 } = incoming;
        if (!variantId) {
          console.error(
            `addOrUpdateItem: rejected item ${id} — variantId (real ProductVariant.id) is required`
          );
          return;
        }
        set((s) => {
          s.isAddingToCart = true;
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
        setTimeout(() => {
          set((s) => {
            s.isAddingToCart = false;
            return { isAddingToCart: false };
          });
        }, 1000);
      },

      setQuantity: (id, variantId = "", qty) => {
        if (!qty || qty < 1) {
          get().removeItem(id, variantId);
          return;
        }
        set((s) => ({
          cart: s.cart.map((i) =>
            i.id === id && (i.variantId ?? "") === variantId
              ? { ...i, quantity: Math.min(qty, i.maxQuantity) }
              : i
          ),
        }));
      },

      removeItem: (id, variantId = "") =>
        set((s) => ({
          cart: s.cart.filter(
            (i) => !(i.id === id && (i.variantId ?? "") === variantId)
          ),
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

      applyCoupon: (coupon) => set({ coupon }),
      removeCoupon: () => set({ coupon: null }),

      getItemCount: () => get().cart.reduce((sum, i) => sum + i.quantity, 0),

      getItemCountById: (id) =>
        get().cart.reduce((sum, i) => sum + (i.id === id ? i.quantity : 0), 0),

      getItemCountByVariantId: (id, variantId = "") =>
        get().cart.reduce(
          (sum, i) =>
            sum +
            (i.id === id && (i.variantId ?? "") === variantId ? i.quantity : 0),
          0
        ),

      getSubTotal: () =>
        get().cart.reduce((sum, i) => sum + i.price * i.quantity, 0),

      getTotalPrice: () => {
        const sub = get().getSubTotal();
        return Number((sub / 100).toFixed(2));
      },

      getTotalUniqueItems: () => get().cart.length,

      loadServerCart: (items) => set({ cart: items }),
    }),
    {
      name: STORAGE_KEY,
      // storage: createJSONStorage(() => cookieStorage),
      partialize: (state) => ({
        cart: state.cart,
        coupon: state.coupon,
      }),
    }
  )
);
