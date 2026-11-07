import OrdersClientPage from "./_components/order-client";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getOrdersWithItems } from "./_lib/order-queries";

export const metadata = {
  title: "Order History",
  description: "View and manage your order history",
};

export default async function OrdersPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user?.id) {
    return <div>Please login to view your orders.</div>;
  }

  const orders = await getOrdersWithItems(session.user.id);

  return <OrdersClientPage orders={orders} />;
}
