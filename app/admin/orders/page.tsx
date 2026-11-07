import Link from "next/link";
import type { OrderStatus, Prisma } from "@/lib/generated/prisma";
import { prisma } from "@/lib/prisma";
import { formatMoney } from "@/lib/money";

export const metadata = { title: "Orders" };

const statuses = ["", "PENDING", "PAID", "FULFILLED", "CANCELLED", "REFUNDED"];

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const { q, status } = await searchParams;
  const where: Prisma.OrderWhereInput = {};
  if (q) {
    where.OR = [
      { orderNumber: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
    ];
  }
  if (status && statuses.includes(status)) where.status = status as OrderStatus;

  const orders = await prisma.order.findMany({
    where,
    include: { _count: { select: { items: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl">Orders</h1>
        <p className="text-sm text-muted-foreground">{orders.length} shown</p>
      </div>

      <form className="flex flex-wrap gap-2" method="get">
        <input
          name="q"
          defaultValue={q ?? ""}
          placeholder="Order number or email"
          className="h-9 rounded-md border border-border bg-background px-3 text-sm"
        />
        <select
          name="status"
          defaultValue={status ?? ""}
          className="h-9 rounded-md border border-border bg-background px-3 text-sm"
        >
          <option value="">All statuses</option>
          {statuses.slice(1).map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
        <button type="submit" className="h-9 rounded-md border border-border px-4 text-sm">
          Filter
        </button>
      </form>

      <div className="overflow-x-auto rounded-xl border border-border/60 bg-background">
        {orders.length === 0 ? (
          <p className="px-5 py-10 text-sm text-muted-foreground">No orders found.</p>
        ) : (
          <table className="w-full min-w-[760px] text-sm">
            <thead className="border-b border-border/60 text-left text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Order</th>
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Fulfillment</th>
                <th className="px-4 py-3 font-medium">Items</th>
                <th className="px-4 py-3 font-medium">Total</th>
                <th className="px-4 py-3 font-medium">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-muted/40">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="font-medium hover:underline"
                    >
                      {order.orderNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <p>{order.name ?? "—"}</p>
                    <p className="text-xs text-muted-foreground">{order.email}</p>
                  </td>
                  <td className="px-4 py-3">{order.status}</td>
                  <td className="px-4 py-3">{order.fulfillmentStatus}</td>
                  <td className="px-4 py-3">{order._count.items}</td>
                  <td className="px-4 py-3">{formatMoney(order.total, order.currency)}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {order.createdAt.toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
