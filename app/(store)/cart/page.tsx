import { Container } from "@/components/store/container";
import { CartView } from "@/components/store/cart-view";

export const metadata = { title: "Cart" };

export default function CartPage() {
  return (
    <Container className="py-10">
      <h1 className="mb-8 font-serif text-4xl">Your cart</h1>
      <CartView />
    </Container>
  );
}
