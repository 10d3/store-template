import { stripeClient } from "../stripe";

export async function createPaymentIntent() {
  const paymentIntent = await stripeClient.paymentIntents.create({
    amount: 1000,
    currency: "usd",
    automatic_payment_methods: {
      enabled: true,
    },
  });
  return paymentIntent.client_secret;
}
