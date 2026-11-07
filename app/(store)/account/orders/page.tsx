import Link from "next/link";
import { Container } from "@/components/store/container";
import { formatMoney } from "@/lib/money";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

export const metadata = { title: "Your orders" };

export default async function AccountOrdersPage() {
  const session = await requireUser();
  const orders = await prisma.order.findMany({
    where: { userId: session.user.id },
    include: { items: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <Container className="py-10">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="font-serif text-4xl">Your orders</h1>
        <Link href="/account" className="text-sm underline underline-offset-4">
          Back to account
        </Link>
      </div>

      {orders.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center">
          <p className="font-medium">No orders yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Once you place an order, it will appear here.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-border/60 rounded-xl border border-border/60">
          {orders.map((order) => (
            <Link
              key={order.id}
              href={`/account/orders/${order.orderNumber}`}
              className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 text-sm hover:bg-muted/40"
            >
              <div>
                <p className="font-medium">{order.orderNumber}</p>
                <p className="text-muted-foreground">
                  {order.createdAt.toLocaleDateString()} · {order.items.length}{" "}
                  items
                </p>
              </div>
              <span className="rounded-full bg-muted px-3 py-1 text-xs">
                {order.status}
              </span>
              <span className="font-medium">
                {formatMoney(order.total, order.currency)}
              </span>
            </Link>
          ))}
        </div>
      )}
    </Container>
  );
}
