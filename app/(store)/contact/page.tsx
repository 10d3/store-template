import { Container } from "@/components/store/container";

export const metadata = { title: "Contact" };

export default function ContactPage() {
  return (
    <Container className="max-w-2xl py-16">
      <h1 className="font-serif text-4xl">Contact</h1>
      <p className="mt-4 text-muted-foreground">
        For product questions, order help, or wholesale enquiries, email us and
        we will reply within one business day.
      </p>
      <a
        href="mailto:hello@vitanou.com"
        className="mt-6 inline-block rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground"
      >
        hello@vitanou.com
      </a>
      <div className="mt-10 space-y-2 text-sm text-muted-foreground">
        <p>Customer support: Monday–Friday, 9am–5pm EST.</p>
        <p>
          Order issues? Have your order number ready and use the{" "}
          <a href="/orders" className="underline">
            order lookup
          </a>
          .
        </p>
      </div>
    </Container>
  );
}
