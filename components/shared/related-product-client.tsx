"use client";

import dynamic from "next/dynamic";

const RelatedProducts = dynamic(
    () => import("@/components/shared/related-products"),
    { ssr: false }
);

export default function RelatedProductsClient({
    products,
}: {
    products: any[];
}) {
    return <RelatedProducts products={products} title="" className="py-0" />;
}
