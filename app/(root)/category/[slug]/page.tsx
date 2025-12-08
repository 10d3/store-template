import React from "react";
import type { Metadata } from "next";

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

export default async function page(props: {
  params: Promise<{ slug: string }>;
}) {
  const params = await props.params;
  console.log(params.slug);

  return <div>page</div>;
}
