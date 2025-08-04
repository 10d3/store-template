"use client";

import { useState, useEffect } from "react";
import type { StripeProduct } from "@/types/product";
import { getCachedProducts } from "@/lib/product/cache";
import { validateProduct, validatePack, type ProductDisplay, type PackDisplay } from "@/lib/product/display.schema";

interface UseProductsReturn {
  products: ProductDisplay[];
  packs: PackDisplay[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

// Transform Stripe product to ProductDisplay
function transformProductForDisplay(product: StripeProduct): ProductDisplay | null {
  const price = typeof product.default_price === 'object' && product.default_price?.unit_amount 
    ? product.default_price.unit_amount / 100 
    : 0;
  
  const transformed = {
    id: product.id,
    name: product.name,
    price: price,
    image: product.images?.[0] || "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=400&fit=crop&crop=center",
    hoverMedia: product.images?.[1] ? {
      type: "image" as const,
      src: product.images[1],
    } : undefined,
  };

  return validateProduct(transformed);
}

// Transform pack products for PackDisplay
function transformPackForDisplay(packProduct: StripeProduct, allProducts: StripeProduct[]): PackDisplay | null {
  const productIds = packProduct.metadata.contents?.split(',') || [];
  const discount = packProduct.metadata.discount ? parseInt(packProduct.metadata.discount) : 0;
  
  const products = productIds
    .map(id => {
      const product = allProducts.find(p => p.id === id);
      return product ? transformProductForDisplay(product) : null;
    })
    .filter((product): product is ProductDisplay => product !== null);
  
  if (products.length === 0) return null;
  
  const transformed = {
    id: packProduct.id,
    name: packProduct.name,
    products: products,
    bundleDiscount: discount,
  };

  return validatePack(transformed);
}

export function useProducts(): UseProductsReturn {
  const [products, setProducts] = useState<ProductDisplay[]>([]);
  const [packs, setPacks] = useState<PackDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const allStripeProducts = await getCachedProducts();
      
      // Separate regular products from packs (bundles)
      const regularProducts = allStripeProducts.filter(product => 
        product.metadata.type !== "bundle"
      );
      
      const packProducts = allStripeProducts.filter(product => 
        product.metadata.type === "bundle"
      );
      
      // Transform and validate products
      const validProducts = regularProducts
        .map(transformProductForDisplay)
        .filter((product): product is ProductDisplay => product !== null);
      
      const validPacks = packProducts
        .map(pack => transformPackForDisplay(pack, allStripeProducts))
        .filter((pack): pack is PackDisplay => pack !== null);
      
      setProducts(validProducts);
      setPacks(validPacks);
    } catch (err) {
      console.error("Failed to fetch products:", err);
      setError(err instanceof Error ? err.message : "Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  return {
    products,
    packs,
    loading,
    error,
    refetch: fetchProducts,
  };
}