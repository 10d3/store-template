"use server"; // Add at the top of the file

import { unstable_cache, revalidateTag } from "next/cache";
import { listProducts as originalListProducts } from "./crud";
import { getProductsByIdsCached, listProductsFromDB } from "./db-queries";
import { transformPackToProductData } from "./pack-transformer";
import { ProductData, StripeProduct } from "@/types/product";
import { prisma } from "../prisma";
import { transformDbProduct } from "../utils";

// Flag to enable database reads (set to true after initial sync)
const USE_DATABASE = true;

// Cache products for 5 minutes
export const getCachedProducts = unstable_cache(
  async () => {
    // Use database for fast reads, falls back to Stripe API if needed
    if (USE_DATABASE) {
      try {
        const products = await listProductsFromDB();
        // If we have products in DB, use them
        if (products.length > 0) {
          return products;
        }
      } catch (error) {
        console.warn("Database read failed, falling back to Stripe API:", error);
      }
    }
    // Fallback to Stripe API
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

// Cached version of getProduct - uses cached products list
// This is MUCH faster than the uncached version since it doesn't
// make Stripe API + Prisma calls on every page load
export async function getCachedProduct(slug: string) {
  const products = await getCachedProducts();
  const variants = products.filter(
    (product) => product.metadata.slug === slug
  );
  return variants;
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

export const getPackBySlug = unstable_cache(async (slug: string) => {
  const pack = await prisma.product.findUnique({
    where: {
      slug
    },
    // 1. Fetch the related prices so the types match
    include: {
      prices: true,
      // nutrition: true, // Include this too if your transformer needs it
    }
  });

  // 2. Handle the case where the product wasn't found
  if (!pack) {
    return null;
    // or: throw new Error("Product not found");
  }

  // Now 'pack' is guaranteed to be non-null and have 'prices'
  return transformDbProduct(pack);
})

export async function transformPacksToProductData(
  packs: StripeProduct[]
): Promise<ProductData[]> {
  const results: ProductData[] = [];

  // Gather all content IDs from all packs
  const contentIds = packs.flatMap((pack) =>
    pack.metadata?.contents?.split(",").filter(Boolean) || []
  );

  // Fetch only the products actually referenced in packs
  const relevantProducts = await getProductsByIdsCached(contentIds);

  for (const pack of packs) {
    const packContentIds = pack.metadata?.contents?.split(",").filter(Boolean) || [];
    const baseProduct = packContentIds.length > 0
      ? relevantProducts.find((p) => p.id === packContentIds[0])
      : null;

    const productData = transformPackToProductData(pack, baseProduct);
    if (productData) results.push(productData);
  }

  return results;
}
