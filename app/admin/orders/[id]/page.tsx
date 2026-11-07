import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { updateOrder } from "@/lib/admin/actions";
import { formatMoney } from "@/lib/money";

export const metadata = { title: "Order" };

const orderStatuses = ["PENDING", "PAID", "FULFILLED", "CANCELLED", "REFUNDED"];
const fulfillmentStatuses = ["UNFULFILLED", "SHIPPED", "DELIVERED"];

export default async function AdminOrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: true, user: true },
  });

  if (!order) notFound();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/admin/orders" className="text-sm text-muted-foreground hover:underline">
            ← Orders
          </Link>
          <h1 className="mt-2 font-serif text-3xl">{order.orderNumber}</h1>
          <p className="text-sm text-muted-foreground">
            {order.createdAt.toLocaleString()} · {order.email}
          </p>
        </div>
        {order.stripePaymentIntentId && (
          <a
            href={`https://dashboard.stripe.com/payments/${order.stripePaymentIntentId}`}
            target="_blank"
            rel="noreferrer"
            className="rounded-md border border-border px-3 py-2 text-sm"
          >
            Open in Stripe
          </a>
        )}
      </div>

      <section className="rounded-xl border border-border/60 bg-background p-5">
        <h2 className="font-medium">Update order</h2>
        <form action={updateOrder} className="mt-4 grid gap-4 sm:grid-cols-2">
          <input type="hidden" name="id" value={order.id} />
          <label className="space-y-1 text-sm">
            <span>Order status</span>
            <select
              name="status"
              defaultValue={order.status}
              className="w-full rounded-md border border-border bg-background px-3 py-2"
            >
              {orderStatuses.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1 text-sm">
            <span>Fulfillment</span>
            <select
              name="fulfillmentStatus"
              defaultValue={order.fulfillmentStatus}
              className="w-full rounded-md border border-border bg-background px-3 py-2"
            >
              {fulfillmentStatuses.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1 text-sm">
            <span>Carrier</span>
            <input
              name="carrier"
              defaultValue={order.carrier ?? ""}
              className="w-full rounded-md border border-border bg-background px-3 py-2"
            />
          </label>
          <label className="space-y-1 text-sm">
            <span>Tracking number</span>
            <input
              name="trackingNumber"
              defaultValue={order.trackingNumber ?? ""}
              className="w-full rounded-md border border-border bg-background px-3 py-2"
            />
          </label>
          <label className="space-y-1 text-sm sm:col-span-2">
            <span>Tracking URL</span>
            <input
              name="trackingUrl"
              defaultValue={order.trackingUrl ?? ""}
              className="w-full rounded-md border border-border bg-background px-3 py-2"
            />
          </label>
          <button
            type="submit"
            className="w-fit rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            Save order
          </button>
        </form>
      </section>

      <section className="rounded-xl border border-border/60 bg-background">
        <h2 className="border-b border-border/60 px-5 py-4 font-medium">Items</h2>
        <div className="divide-y divide-border/60">
          {order.items.map((item) => (
            <div key={item.id} className="flex justify-between gap-4 px-5 py-3 text-sm">
              <div>
                <p className="font-medium">{item.productName}</p>
                <p className="text-xs text-muted-foreground">
                  {item.variantTitle !== "Default" ? `${item.variantTitle} · ` : ""}
                  Qty {item.quantity} × {formatMoney(item.unitPrice, order.currency)}
                </p>
              </div>
              <span>{formatMoney(item.total, order.currency)}</span>
            </div>
          ))}
        </div>
        <div className="space-y-1 border-t border-border/60 px-5 py-4 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span>{formatMoney(order.subtotal, order.currency)}</span>
          </div>
          {order.discount > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Discount</span>
              <span>-{formatMoney(order.discount, order.currency)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-muted-foreground">Shipping</span>
            <span>{formatMoney(order.shipping, order.currency)}</span>
          </div>
          <div className="flex justify-between font-medium">
            <span>Total</span>
            <span>{formatMoney(order.total, order.currency)}</span>
          </div>
        </div>
      </section>
    </div>
  );
}
