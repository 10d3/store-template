import { Metadata } from "next";
import AdminDashboard from "./_components/admin-dashboard";

export const metadata: Metadata = {
  title: "Admin Dashboard",
  description: "Manage your store from the admin dashboard.",
};

export default function AdminPage() {
  return <AdminDashboard />;
}
