import { prisma } from "@/lib/prisma";
import { OrderSummary } from "@/components/store/order-summary";
import { Container } from "@/components/store/container";

export const metadata = { title: "Track your order" };

export default async function GuestOrderLookupPage({
  searchParams,
}: {
  searchParams: Promise<{ orderNumber?: string; email?: string }>;
}) {
  const { orderNumber, email } = await searchParams;
  const lookup =
    orderNumber && email
      ? prisma.order.findFirst({
          where: {
            orderNumber: orderNumber.trim(),
            email: { equals: email.trim(), mode: "insensitive" },
          },
          include: { items: true },
        })
      : null;

  const order = lookup ? await lookup : null;

  return (
    <Container className="py-14">
      <div className="mx-auto max-w-2xl">
        <h1 className="font-serif text-3xl">Track your order</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Enter the order number from your confirmation email and the email you
          used at checkout.
        </p>

        <form className="mt-8 grid gap-4 sm:grid-cols-2" method="get">
          <label className="space-y-1 text-sm">
            <span>Order number</span>
            <input
              name="orderNumber"
              defaultValue={orderNumber ?? ""}
              placeholder="VIT-ABC123"
              required
              className="w-full rounded-md border border-border bg-background px-3 py-2"
            />
          </label>
          <label className="space-y-1 text-sm">
            <span>Email</span>
            <input
              name="email"
              type="email"
              defaultValue={email ?? ""}
              required
              className="w-full rounded-md border border-border bg-background px-3 py-2"
            />
          </label>
          <button
            type="submit"
            className="h-10 rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground sm:col-span-2"
          >
            Find order
          </button>
        </form>

        {orderNumber && email && !order && (
          <p className="mt-6 rounded-md border border-destructive/40 bg-destructive/5 p-4 text-sm">
            No order found with that number and email.
          </p>
        )}
      </div>

      {order && (
        <div className="mt-12">
          <OrderSummary order={order} />
        </div>
      )}
    </Container>
  );
}
