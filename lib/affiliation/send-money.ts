import { getStripeClient } from "../stripe";

export const sendMoney = async (bankAccount: string, amount: number) => {
  const stripe = getStripeClient();
  await stripe.transfers.create({
    amount: amount * 100,
    currency: "usd",
    destination: bankAccount,
  });
};
