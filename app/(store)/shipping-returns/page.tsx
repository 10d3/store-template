import { Container } from "@/components/store/container";

export const metadata = { title: "Shipping & returns" };

export default function ShippingReturnsPage() {
  return (
    <Container className="max-w-3xl py-16">
      <h1 className="font-serif text-4xl">Shipping & returns</h1>
      <div className="mt-6 space-y-4 text-muted-foreground">
        <p>
          Orders ship within 1–2 business days. Tracking is emailed as soon as
          your parcel is on its way.
        </p>
        <p>
          Unopened products can be returned within 30 days of delivery. Email{" "}
          <a className="underline" href="mailto:hello@vitanou.com">
            hello@vitanou.com
          </a>{" "}
          with your order number and we will send return instructions.
        </p>
        <p>
          Damaged or incorrect items are replaced at no cost. Please include a
          photo with your message.
        </p>
      </div>
    </Container>
  );
}
