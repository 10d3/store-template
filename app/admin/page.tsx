import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatMoney } from "@/lib/money";

export const metadata = { title: "Admin dashboard" };

export default async function AdminDashboardPage() {
  const [revenue, orderCount, productCount, emails, recent] = await Promise.all([
    prisma.order.aggregate({
      where: { paymentStatus: "PAID" },
      _sum: { total: true },
    }),
    prisma.order.count(),
    prisma.product.count({ where: { status: { not: "ARCHIVED" } } }),
    prisma.order.findMany({ distinct: ["email"], select: { email: true } }),
    prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      select: {
        id: true,
        orderNumber: true,
        email: true,
        total: true,
        currency: true,
        status: true,
        createdAt: true,
      },
    }),
  ]);

  const cards = [
    { label: "Revenue", value: formatMoney(revenue._sum.total ?? 0) },
    { label: "Orders", value: orderCount.toString() },
    { label: "Products", value: productCount.toString() },
    { label: "Customers", value: emails.length.toString() },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          A quick look at the store.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className="rounded-xl border border-border/60 bg-background p-5">
            <p className="text-sm text-muted-foreground">{card.label}</p>
            <p className="mt-2 text-2xl font-medium">{card.value}</p>
          </div>
        ))}
      </div>

      <section className="rounded-xl border border-border/60 bg-background">
        <div className="flex items-center justify-between border-b border-border/60 px-5 py-4">
          <h2 className="font-medium">Recent orders</h2>
          <Link href="/admin/orders" className="text-sm text-muted-foreground hover:underline">
            View all
          </Link>
        </div>
        {recent.length === 0 ? (
          <p className="px-5 py-8 text-sm text-muted-foreground">No orders yet.</p>
        ) : (
          <div className="divide-y divide-border/60">
            {recent.map((order) => (
              <Link
                key={order.id}
                href={`/admin/orders/${order.id}`}
                className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 text-sm hover:bg-muted/40"
              >
                <span className="font-medium">{order.orderNumber}</span>
                <span className="text-muted-foreground">{order.email}</span>
                <span>{formatMoney(order.total, order.currency)}</span>
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs">{order.status}</span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
