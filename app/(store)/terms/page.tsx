import { Container } from "@/components/store/container";

export const metadata = { title: "Terms of service" };

export default function TermsPage() {
  return (
    <Container className="max-w-3xl py-16">
      <h1 className="font-serif text-4xl">Terms of service</h1>
      <div className="mt-6 space-y-4 text-sm text-muted-foreground">
        <p>
          By using this store you agree to provide accurate order and contact
          information and to use the site lawfully.
        </p>
        <p>
          Product statements have not been evaluated by the FDA and are not
          intended to diagnose, treat, cure, or prevent any disease. Consult a
          healthcare professional before starting a supplement.
        </p>
        <p>
          Prices and availability may change without notice. Orders may be
          cancelled if payment cannot be verified or stock is unavailable.
        </p>
      </div>
    </Container>
  );
}
