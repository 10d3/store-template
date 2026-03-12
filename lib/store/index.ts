/* eslint-disable @typescript-eslint/no-explicit-any */
import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface BundlePack {
  id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  maxQuantity: number;
  items: CartItem[];
  discount: number;
  originalPrice: number;
  discountType: "percent" | "fixed";
}
export interface CartItem {
  id: string;
  variantId?: string; // e.g. "42-red-XL"
  sku?: string; // optional human sku
  name: string;
  image: string;
  price: number; // unit price in cents
  quantity: number;
  maxQuantity: number; // stock limit
  stripePriceId?: string; // ← NEW: pass to Checkout
  metadata?: Record<string, any>; // ← NEW: pack_size, group, …
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
  addBundleAsPack: (bundle: BundlePack) => void; // pre-defined bundle as pack
  addVirtualBundle: (stripePriceId: string, qty: number) => void; // virtual
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
        const { id, variantId = "", quantity = 1 } = incoming;
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
            i.id === id && i.variantId === variantId
              ? { ...i, quantity: Math.min(qty, i.maxQuantity) }
              : i
          ),
        }));
      },

      removeItem: (id, variantId = "") =>
        set((s) => ({
          cart: s.cart.filter(
            (i) => !(i.id === id && i.variantId === variantId)
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

      // Add this new action alongside your existing addBundle
      addBundleAsPack: (bundleData) =>
        set((s) => {
          const next = [...s.cart];

          // Create a single cart item for the entire bundle
          const bundleCartItem: CartItem = {
            id: bundleData.id, // bundle/pack ID
            name: bundleData.name,
            price: bundleData.price, // the discounted bundle price
            quantity: bundleData.quantity || 1,
            maxQuantity: bundleData.maxQuantity || 10,
            image:
              bundleData.image ||
              bundleData.items[0]?.image ||
              "/default-bundle.png",
            metadata: {
              type: "bundle", // identifier to distinguish from individual items
              bundleItems: bundleData.items, // store the individual items for reference
              discount: bundleData.discount,
              originalPrice: bundleData.originalPrice,
              discountType: bundleData.discountType,
            },
          };

          // Check if this bundle is already in cart
          const existingBundleIndex = next.findIndex(
            (item) =>
              item.id === bundleData.id && item.metadata?.type === "bundle"
          );

          if (existingBundleIndex >= 0) {
            // Update quantity if bundle already exists
            next[existingBundleIndex].quantity = Math.min(
              next[existingBundleIndex].quantity + (bundleData.quantity || 1),
              next[existingBundleIndex].maxQuantity
            );
          } else {
            // Add new bundle to cart
            next.push(bundleCartItem);
          }

          return { cart: next };
        }),

      /* Virtual bundle – single Price ID represents the whole pack */
      addVirtualBundle: (stripePriceId, qty) => {
        /* You can map the Price ID to a known virtual bundle item */
        const virtualItem: CartItem = {
          id: "test", // virtual placeholder
          name: "Mystery Coffee 3-Pack",
          image: "/images/mystery.png",
          price: 2400, // fetch from Stripe
          quantity: qty,
          maxQuantity: 100,
          stripePriceId,
          metadata: { type: "virtual_bundle" },
        };
        get().addOrUpdateItem(virtualItem);
      },

      applyCoupon: (coupon) => set({ coupon }),
      removeCoupon: () => set({ coupon: null }),

      getItemCount: () => get().cart.reduce((sum, i) => sum + i.quantity, 0),

      getItemCountById: (id) =>
        get().cart.reduce((sum, i) => sum + (i.id === id ? i.quantity : 0), 0),

      getItemCountByVariantId: (id, variantId = "") =>
        get().cart.reduce(
          (sum, i) =>
            sum + (i.id === id && i.variantId === variantId ? i.quantity : 0),
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
