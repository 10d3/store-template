import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { OrderSummary } from "@/components/store/order-summary";

export default async function AccountOrderPage({
  params,
}: {
  params: Promise<{ orderNumber: string }>;
}) {
  const session = await requireUser();
  const { orderNumber } = await params;

  const order = await prisma.order.findFirst({
    where: { orderNumber, userId: session.user.id },
    include: { items: true },
  });

  if (!order) notFound();

  return (
    <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6">
      <Link
        href="/account/orders"
        className="text-sm text-muted-foreground hover:underline"
      >
        ← All orders
      </Link>
      <h1 className="mt-4 font-serif text-3xl">Order {order.orderNumber}</h1>
      <div className="mt-8">
        <OrderSummary order={order} />
      </div>
    </div>
  );
}
