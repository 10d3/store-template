import { Metadata } from "next";
import CjImportPage from "../_components/cj-import-page";

export const metadata: Metadata = {
  title: "CJ Dropshipping Import",
  description: "Import products from CJ Dropshipping into your store.",
};

export default function Page() {
  return <CjImportPage />;
}
