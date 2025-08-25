import OrdersClientPage from "./_components/order-client";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getOrders } from "@/lib/order";

export const metadata = {
  title: "Order History",
  description: "View and manage your order history",
};

export default async function OrdersPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user?.id) {
    return <div>Please login to view your orders.</div>;
  }

  const orders = await getOrders(session.user.id);

  return <OrdersClientPage orders={orders} />;
}
