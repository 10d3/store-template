import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProductById, listProducts } from "@/lib/admin/catalog-admin";
import ProductEditorClient from "../../_components/product-editor-client";

export const metadata: Metadata = {
  title: "Edit Product",
  description: "Update an existing product in your store catalog.",
};

export default async function Page(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  const product = await getProductById(id);
  if (!product) notFound();

  const products = await listProducts();
  return <ProductEditorClient product={product} products={products} />;
}
