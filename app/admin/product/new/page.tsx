import { Metadata } from "next";
import { listProducts } from "@/lib/admin/catalog-admin";
import ProductEditorClient from "../_components/product-editor-client";

export const metadata: Metadata = {
  title: "Create Product",
  description: "Add a new product to your store catalog.",
};

export default async function Page() {
  const products = await listProducts();
  return <ProductEditorClient products={products} />;
}
