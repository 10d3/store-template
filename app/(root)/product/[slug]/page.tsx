import { getProduct } from "@/lib/product/crud";
import React from "react";

export default async function page({
  props,
}: {
  props: {
    params: Promise<{ slug: string }>;
    searchParams: Promise<{ variant?: string; image?: string }>;
  };
}) {
  const params = await props.params;
  const searchParams = await props.searchParams;

  console.log(params.slug, searchParams);

  const variants = await getProduct(params.slug);
  const selectedVariant = (variants)
  console.log(selectedVariant)

  return (
    <main className="flex flex-col gap-2 w-full">
      <div className="w-full md:w-4/6 h-1/2 md:h-full"></div>
      <div className="w-full md:w-2/6 h-1/2 md:h-full"></div>
    </main>
  );
}
