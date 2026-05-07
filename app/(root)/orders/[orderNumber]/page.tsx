import { auth } from "@/lib/auth";
import { getOrderByNumberPublic } from "@/lib/order";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import OrderDetailClient from "./_components/order-detail-client";
import { Order } from "@/lib/generated/prisma";

interface OrderDetailPageProps {
  params: Promise<{ orderNumber: string }>;
  searchParams: Promise<{ email?: string }>;
}

export const metadata = {
  title: "Order Details",
  description: "View your order details",
};

export default async function OrderDetailPage({ 
  params, 
  searchParams 
}: OrderDetailPageProps) {
  const { orderNumber } = await params;
  const { email: emailParam } = await searchParams;
  const session = await auth.api.getSession({ headers: await headers() });

  const result = await getOrderByNumberPublic(orderNumber, emailParam);

  if (!result.order) {
    if (result.requiresAuth) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center space-y-4">
            <h1 className="text-2xl font-semibold">Login Required</h1>
            <p className="text-muted-foreground">Please log in to view this order.</p>
            <a 
              href={`/login?redirect=/orders/${orderNumber}`}
              className="inline-flex items-center justify-center px-4 py-2 bg-primary text-primary-foreground rounded-md"
            >
              Log In
            </a>
          </div>
        </div>
      );
    }

    if (result.emailRequired) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="w-full max-w-md space-y-6">
            <div className="text-center space-y-2">
              <h1 className="text-2xl font-semibold">Order Lookup</h1>
              <p className="text-muted-foreground">Enter your email to view order #{orderNumber}</p>
            </div>
            <form className="space-y-4">
              <input 
                type="email" 
                name="email" 
                placeholder="Your email address"
                className="w-full px-4 py-2 border rounded-md"
                required
              />
              <button 
                type="submit"
                className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md"
              >
                View Order
              </button>
            </form>
          </div>
        </div>
      );
    }

    return notFound();
  }

  if (result.requiresAuth && session?.user?.id !== result.order.userId) {
    return notFound();
  }

  return <OrderDetailClient order={result.order as Order} />;
}
