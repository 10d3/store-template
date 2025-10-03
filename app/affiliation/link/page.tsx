import { listProducts } from "@/lib/product/crud";
import React from "react";
import Image from "next/image";
import { CopyLinkButton } from "./_components/copy-link-button";
import { getBaseURL } from "@/lib/utils";
import { getRefferalCode } from "@/lib/affiliation/affiliate-data";

export default async function page() {
  const refferalCode = await getRefferalCode();
  const products = await listProducts();
  const transformedDataProduct = products.map((product) => ({
    id: product.id,
    name: product.name,
    description: product?.description || "",
    image: product?.images?.[0] as string,
    metadata: product.metadata,
  }));
  return (
    <div className="p-4 flex flex-col gap-8">
      <h1 className="text-2xl font-bold text-foreground">
        Products affiliate links
      </h1>
      <div className="grid grid-cols-2 gap-6">
        {transformedDataProduct.map((product) => (
          <div
            key={product.id}
            className="flex items-center gap-6 rounded-2xl bg-card p-6 shadow-sm transition-shadow hover:shadow-md"
          >
            {/* Product Image */}
            <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-xl">
              <Image
                src={product.image || "/placeholder.svg"}
                alt={product.name}
                fill
                className="object-cover"
              />
            </div>

            {/* Product Info */}
            <div className="flex-1">
              <h3 className="text-base font-medium text-foreground">
                {product.name}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                {product.description}
              </p>
            </div>
            <div className="flex items-center gap-3 rounded-lg bg-muted px-4 py-3">
              <div className="max-w-xs">
                <p className="truncate text-sm text-muted-foreground">
                  {`${getBaseURL()}/product/${product.metadata.slug}?ref=${refferalCode}`}
                </p>
              </div>
              <CopyLinkButton
                productId={product.id}
                link={`${getBaseURL()}/product/${product.metadata.slug}?ref=${refferalCode}`}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
