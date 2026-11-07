import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { Container } from "@/components/store/container";
import { ClearCart } from "@/components/store/clear-cart";
import { OrderSummary } from "@/components/store/order-summary";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Order confirmed" };

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id } = await searchParams;
  const order = session_id
    ? await prisma.order.findUnique({
        where: { stripeSessionId: session_id },
        include: { items: true },
      })
    : null;

  if (!order) {
    return (
      <Container className="py-20 text-center">
        <h1 className="font-serif text-4xl">We&apos;re confirming your payment</h1>
        <p className="mx-auto mt-3 max-w-md text-muted-foreground">
          This usually takes a few seconds. Refresh this page in a moment, or
          check your orders.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Button asChild className="rounded-full">
            <Link href="/account/orders">View orders</Link>
          </Button>
          <Button asChild variant="outline" className="rounded-full">
            <Link href="/shop">Continue shopping</Link>
          </Button>
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-10">
      <ClearCart />
      <div className="mb-10 text-center">
        <CheckCircle2 className="mx-auto size-10" />
        <h1 className="mt-4 font-serif text-4xl">Thank you</h1>
        <p className="mt-2 text-muted-foreground">
          Your order is confirmed. A receipt is on its way to {order.email}.
        </p>
      </div>
      <OrderSummary order={order} />
    </Container>
  );
}
