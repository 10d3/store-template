import { unstable_cache } from "next/cache";
import { listProducts as originalListProducts } from "./crud";

// Cache products for 5 minutes
export const getCachedProducts = unstable_cache(
  async () => {
    return await originalListProducts();
  },
  ["stripe-products"],
  {
    revalidate: 300, // 5 minutes
    tags: ["products"],
  }
);

// Helper to revalidate product cache
export async function revalidateProductCache() {
  // This would be called when products are updated in Stripe
  // You can call this from webhooks or admin actions
  const { revalidateTag } = await import("next/cache");
  revalidateTag("products");
}