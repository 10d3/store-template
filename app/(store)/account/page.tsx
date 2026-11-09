import Link from "next/link";
import { Container } from "@/components/store/container";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/money";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

export const metadata = { title: "Account" };

export default async function AccountPage() {
  const session = await requireUser();
  const orders = await prisma.order.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  return (
    <Container className="py-12 md:py-16">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-5xl font-light tracking-tight">Account</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {session.user.name} · {session.user.email}
          </p>
        </div>
        <SignOutButton />
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-[240px_1fr]">
        <nav className="h-fit rounded-2xl border bg-card p-2 text-sm shadow-sm">
          <Link
            href="/account"
            className="block rounded-md bg-muted px-3 py-2 font-medium"
          >
            Orders
          </Link>
          <Link
            href="/account/addresses"
            className="block rounded-md px-3 py-2 text-muted-foreground hover:text-foreground"
          >
            Addresses
          </Link>
          <Link
            href="/orders"
            className="block rounded-md px-3 py-2 text-muted-foreground hover:text-foreground"
          >
            Track a guest order
          </Link>
        </nav>

        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-serif text-2xl">Recent orders</h2>
            <Button asChild variant="outline" size="sm">
              <Link href="/account/orders">View all</Link>
            </Button>
          </div>

          {orders.length === 0 ? (
            <div className="rounded-3xl border border-dashed bg-card p-10 text-center">
              <p className="font-medium">No orders yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Your orders will show up here after checkout.
              </p>
              <Button asChild className="mt-5 rounded-full">
                <Link href="/shop">Start shopping</Link>
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-border/60 rounded-2xl border bg-card shadow-sm">
              {orders.map((order) => (
                <Link
                  key={order.id}
                  href={`/account/orders/${order.orderNumber}`}
                  className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 text-sm hover:bg-muted/40"
                >
                  <div>
                    <p className="font-medium">{order.orderNumber}</p>
                    <p className="text-muted-foreground">
                      {order.createdAt.toLocaleDateString()}
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
        </section>
      </div>
    </Container>
  );
}
