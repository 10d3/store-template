import { prisma } from "@/lib/prisma";
import { formatMoney } from "@/lib/money";

export const metadata = { title: "Customers" };

interface CustomerRow {
  email: string;
  name: string;
  orders: number;
  total: number;
  registered: boolean;
}

export default async function AdminCustomersPage() {
  const [users, guestOrders] = await Promise.all([
    prisma.user.findMany({
      select: {
        name: true,
        email: true,
        _count: { select: { orders: true } },
        orders: { select: { total: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    prisma.order.findMany({
      where: { userId: null },
      select: { email: true, name: true, total: true },
      orderBy: { createdAt: "desc" },
      take: 500,
    }),
  ]);

  const rows = new Map<string, CustomerRow>();

  for (const user of users) {
    rows.set(user.email.toLowerCase(), {
      email: user.email,
      name: user.name,
      orders: user._count.orders,
      total: user.orders.reduce((sum, order) => sum + order.total, 0),
      registered: true,
    });
  }

  for (const order of guestOrders) {
    const key = order.email.toLowerCase();
    const row = rows.get(key);
    if (row) {
      row.orders += 1;
      row.total += order.total;
    } else {
      rows.set(key, {
        email: order.email,
        name: order.name ?? "Guest",
        orders: 1,
        total: order.total,
        registered: false,
      });
    }
  }

  const customers = [...rows.values()].sort((a, b) => b.total - a.total);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl">Customers</h1>
        <p className="text-sm text-muted-foreground">
          Registered accounts and guest checkout emails.
        </p>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border/60 bg-background">
        {customers.length === 0 ? (
          <p className="px-5 py-10 text-sm text-muted-foreground">No customers yet.</p>
        ) : (
          <table className="w-full min-w-[620px] text-sm">
            <thead className="border-b border-border/60 text-left text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Orders</th>
                <th className="px-4 py-3 font-medium">Spent</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {customers.map((customer) => (
                <tr key={customer.email}>
                  <td className="px-4 py-3">
                    <p className="font-medium">{customer.name}</p>
                    <p className="text-xs text-muted-foreground">{customer.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    {customer.registered ? "Account" : "Guest"}
                  </td>
                  <td className="px-4 py-3">{customer.orders}</td>
                  <td className="px-4 py-3">{formatMoney(customer.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
