import { Metadata } from "next";
import CouponManagementPage from "./_components/coupon-management-page";

export const metadata: Metadata = {
  title: "Coupon Management",
  description: "Manage your store coupons.",
};

export default function Page() {
  return <CouponManagementPage />;
}
