import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItem {
  id: number;
  variantId?: string; // e.g. "42-red-XL"
  sku?: string;
  name: string;
  image: string;
  price: number; // unit price in smallest currency unit (cents)
  quantity: number;
  maxQuantity: number; // stock limit (backend provides)
}

interface CartStore {
  cart: CartItem[];

  /* CRUD */
  addOrUpdateItem: (
    item: Omit<CartItem, "quantity"> & { quantity?: number }
  ) => void;
  setQuantity: (id: number, variantId?: string, quantity?: number) => void;
  removeItem: (id: number, variantId?: string) => void;
  clearCart: () => void;

  /* derived state */
  getItemCount: () => number;
  getTotalPrice: () => number; // rounded to 2 decimals
  getTotalUniqueItems: () => number;

  /* server sync helpers (optional) */
  loadServerCart: (items: CartItem[]) => void;
}

const STORAGE_KEY = "shop-cart";

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      cart: [],

      /* CRUD */
      addOrUpdateItem: (incoming) => {
        const { id, variantId = "", quantity = 1 } = incoming;
        set((state) => {
          const existingIndex = state.cart.findIndex(
            (i) => i.id === id && i.variantId === variantId
          );

          const newCart = [...state.cart];

          if (existingIndex >= 0) {
            const item = newCart[existingIndex]!;
            const newQty = Math.min(item.quantity + quantity, item.maxQuantity);
            item.quantity = Math.max(newQty, 1);
          } else {
            newCart.push({
              ...incoming,
              quantity: Math.min(quantity, incoming.maxQuantity),
            });
          }
          return { cart: newCart };
        });
      },

      setQuantity: (id, variantId = "", quantity) => {
        if (!quantity || quantity < 1) {
          get().removeItem(id, variantId);
          return;
        }
        set((state) => ({
          cart: state.cart.map((item) =>
            item.id === id && item.variantId === variantId
              ? { ...item, quantity: Math.min(quantity, item.maxQuantity) }
              : item
          ),
        }));
      },

      removeItem: (id, variantId = "") =>
        set((state) => ({
          cart: state.cart.filter(
            (i) => !(i.id === id && i.variantId === variantId)
          ),
        })),

      clearCart: () => set({ cart: [] }),

      /* Derived */
      getItemCount: () =>
        get().cart.reduce((sum, item) => sum + item.quantity, 0),

      getTotalPrice: () => {
        const total = get().cart.reduce(
          (sum, item) => sum + item.price * item.quantity,
          0
        );
        return Number((total / 100).toFixed(2)); // if price stored in cents
      },

      getTotalUniqueItems: () => get().cart.length,

      /* Server sync */
      loadServerCart: (items) => set({ cart: items }),
    }),
    {
      name: STORAGE_KEY,
      partialize: (state) => ({ cart: state.cart }), // persist only cart
    }
  )
);
