"use client";

import { useState, useEffect } from "react";
import type { ProductWithVariants } from "@/lib/catalog";
import { getCachedProducts, getCachedBundles } from "@/lib/catalog";
import { validateProduct, validatePack, type ProductDisplay, type PackDisplay } from "@/lib/product/display.schema";

interface UseProductsReturn {
  products: ProductDisplay[];
  packs: PackDisplay[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

// Transform catalog product to ProductDisplay
function transformProductForDisplay(product: ProductWithVariants): ProductDisplay | null {
  const price = product.defaultVariant?.price
    ? product.defaultVariant.price / 100
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
function transformPackForDisplay(packProduct: ProductWithVariants, allProducts: ProductWithVariants[]): PackDisplay | null {
  const productIds = packProduct.bundleItems.map((item) => item.componentProduct.id);
  const discount = packProduct.metadata?.discount ? parseInt(packProduct.metadata.discount) : 0;
  
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
      
      const [allProducts, bundleProducts] = await Promise.all([
        getCachedProducts(),
        getCachedBundles(),
      ]);
      const catalogProducts = [...allProducts, ...bundleProducts];
      
      // Separate regular products from packs (bundles)
      const regularProducts = catalogProducts.filter(product => 
        !product.isBundle
      );
      
      const packProducts = catalogProducts.filter(product => 
        product.isBundle
      );
      
      // Transform and validate products
      const validProducts = regularProducts
        .map(transformProductForDisplay)
        .filter((product): product is ProductDisplay => product !== null);
      
      const validPacks = packProducts
        .map(pack => transformPackForDisplay(pack, catalogProducts))
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