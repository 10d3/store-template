import { Container } from "@/components/store/container";

export const metadata = { title: "Privacy policy" };

export default function PrivacyPage() {
  return (
    <Container className="max-w-3xl py-16">
      <h1 className="font-serif text-4xl">Privacy policy</h1>
      <div className="mt-6 space-y-4 text-sm text-muted-foreground">
        <p>
          We collect the information needed to fulfil your order: name, email,
          shipping address, and payment confirmation. Card details are handled
          by Stripe and never stored on our servers.
        </p>
        <p>
          We use cookies for sign-in, cart persistence, and aggregate analytics.
          We do not sell customer data.
        </p>
        <p>
          To request a copy or deletion of your data, email{" "}
          <a className="underline" href="mailto:hello@vitanou.com">
            hello@vitanou.com
          </a>
          .
        </p>
      </div>
    </Container>
  );
}
