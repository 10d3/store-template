import { Container } from "@/components/store/container";
import { CartView } from "@/components/store/cart-view";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export const metadata = { title: "Cart" };

export default async function CartPage() {
  const session = await getSession();
  const addresses = session
    ? await prisma.address.findMany({
        where: { userId: session.user.id },
        orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
        select: {
          id: true,
          label: true,
          name: true,
          line1: true,
          line2: true,
          city: true,
          state: true,
          postalCode: true,
          country: true,
          isDefault: true,
        },
      })
    : [];

  return (
    <Container className="py-12 md:py-16">
      <h1 className="mb-8 font-serif text-5xl font-light tracking-tight">Your cart</h1>
      <CartView addresses={addresses} />
    </Container>
  );
}
