"use server"; // Add at the top of the file

import { unstable_cache, revalidateTag } from "next/cache";
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
  revalidateTag("products", "max");
}
