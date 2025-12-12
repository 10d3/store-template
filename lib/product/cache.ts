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

export async function getProductByCategory(slug: string) {
  const products = await getCachedProducts();
  return products.filter((product) => {
    const category = product.metadata?.category;
    const gender = product.metadata?.gender;

    // Check Category
    if (category) {
      const categorySlug = category.toLowerCase().replace(/\s+/g, "-");
      if (categorySlug === slug) return true;
    }

    // Check Gender/Target Audience
    if (gender) {
      if (gender.toLowerCase() === slug) return true;
    }

    return false;
  });
}
