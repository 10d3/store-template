import { Metadata } from "next";
import BundleManagementPage from "./_components/bundle-management-page";

export const metadata: Metadata = {
  title: "Bundle Management",
  description: "Manage your product bundles.",
};

export default function Page() {
  return <BundleManagementPage />;
}
