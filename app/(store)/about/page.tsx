import { Container } from "@/components/store/container";

export const metadata = { title: "About" };

export default function AboutPage() {
  return (
    <Container className="max-w-3xl py-16">
      <h1 className="font-serif text-4xl">About Vitanou</h1>
      <div className="mt-6 space-y-4 text-muted-foreground">
        <p>
          Vitanou makes focused supplements with transparent labels and
          ingredients we would take ourselves. No proprietary blends, no
          filler, no hype.
        </p>
        <p>
          Every product is made in small batches and tested for identity and
          purity before it ships. If a label says it is in the bottle, it is in
          the bottle.
        </p>
        <p>
          Questions about a product or an order? Email{" "}
          <a className="underline" href="mailto:hello@vitanou.com">
            hello@vitanou.com
          </a>
          .
        </p>
      </div>
    </Container>
  );
}
