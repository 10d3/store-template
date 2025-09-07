import { CartSummary } from "@/components/shared/cart/cart-summary";
import { StripeElementsContainer } from "@/components/shared/cart/stripe-elements-container";
import { auth } from "@/lib/auth";
import { createPaymentIntent } from "@/lib/client-secret";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import React, { ReactNode } from "react";

export default async function CartLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await auth.api.getSession({ headers: await headers() });
  if (!user) {
    redirect("/login");
  }

  const clientS = await createPaymentIntent();
  return (
    <StripeElementsContainer
      stripeAccount={process.env.STRIPE_ACCOUNT_ID}
      locale="fr"
      clientSecret={clientS as string}
      publishableKey={process.env.STRIPE_PUBLISHABLE_KEY}
    >
      <div className="min-h-[calc(100dvh-7rem)] xl:grid xl:grid-cols-12 xl:gap-x-8">
        <div className="my-8 xl:col-span-7">{children}</div>
        <div className=" my-8 max-w-[65ch] xl:col-span-5">
          <div className="sticky top-1">
            {/* <h1 className="mb-4 text-3xl font-bold leading-none tracking-tight">
              Your Cart
            </h1> */}
            <CartSummary />
          </div>
        </div>
      </div>
    </StripeElementsContainer>
  );
}
