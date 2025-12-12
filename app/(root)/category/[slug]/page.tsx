import ProductCard from "@/components/shared/product-card";
import { getProductByCategory } from "@/lib/product/cache";
import type { Metadata } from "next";
import React from "react";

export async function generateMetadata(props: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const params = await props.params;
  const slug = params.slug;

  // Format category name from slug
  const categoryName = slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  return {
    title: `${categoryName} | Our Store`,
    description: `Browse our ${categoryName} collection. Find the best products in this category.`,
    openGraph: {
      title: `${categoryName} | Our Store`,
      description: `Browse our ${categoryName} collection. Find the best products in this category.`,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${categoryName} | Our Store`,
      description: `Browse our ${categoryName} collection. Find the best products in this category.`,
    },
  };
}

export default async function categoryPage(props: {
  params: Promise<{ slug: string }>;
}) {
  const params = await props.params;
  const products = await getProductByCategory(params.slug);

  // Format category name for display
  const title = params.slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  // Transform products for ProductCard
  const transformedProducts = products.map((product) => {
    const defaultPrice =
      typeof product.default_price === "object" && product.default_price
        ? product.default_price
        : null;

    return {
      id: product.id,
      name: product.name,
      price: defaultPrice?.unit_amount || 0,
      originalPrice: product.metadata?.original_price
        ? parseInt(product.metadata.original_price)
        : undefined,
      discount: product.metadata?.discount_percent
        ? parseInt(product.metadata.discount_percent)
        : undefined,
      image: product.images?.[0] || "/placeholder.svg",
      hoverMedia: product.images?.[1]
        ? {
          type: "image" as const,
          src: product.images[1],
        }
        : undefined,
      slug: product.metadata?.slug,
    };
  });

  return (
    <div className="min-h-screen container mx-auto py-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold mb-4">{title}</h1>
        <p className="text-muted-foreground">
          {products.length} {products.length === 1 ? "Product" : "Products"} Found
        </p>
      </div>

      {transformedProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {transformedProducts.map((product) => (
            <ProductCard
              key={product.id}
              id={product.id}
              name={product.name}
              price={product.price}
              originalPrice={product.originalPrice}
              discount={product.discount}
              image={product.image}
              slug={product.slug}
              hoverMedia={product.hoverMedia}
              className="hover:scale-105 transition-transform duration-200"
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <h2 className="text-2xl font-bold mb-4">No Products Found</h2>
          <p className="text-gray-600">
            We couldn't find any products in the {title} category.
          </p>
        </div>
      )}
    </div>
  );
}

