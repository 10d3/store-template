import React from "react";
import StripePayment from "./stripe-payment";

export default function CheckoutCard() {
  return (
    <section className="max-w-md pb-12">
      <h1>Checkout</h1>
      <StripePayment />
    </section>
  );
}
