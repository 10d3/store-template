import { Metadata } from "next";
import ProductManagementPage from "./_components/product-management-page";

export const metadata: Metadata = {
  title: "Product Management",
  description: "Manage your store products.",
};

export default function Page() {
  return <ProductManagementPage />;
}
