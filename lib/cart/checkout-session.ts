"use server"
import { headers } from "next/headers";
import { auth } from "../auth";
import { getCachedProducts } from "../product/cache";
import { CartItem } from "../store";
import { stripeClient } from "../stripe";

export async function createCheckoutSession(cart: CartItem[]) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    throw new Error("No session found");
  }
  const productIds = cart.map((item) => item.id);
  const productsFromStripe = await getCachedProducts();
  const products = productsFromStripe.filter((product) =>
    productIds.includes(product.id)
  );
  const productsWithQuantity = products.map((product) => ({
    ...product,
    quantity: cart.find((item) => item.id === product.id)?.quantity || 1,
  }));
  const sessionStripe = await stripeClient.checkout.sessions.create({
    payment_method_types: ["card", "link", "sepa_debit"],
    customer: session.user.stripeCustomerId as string,
    line_items: [
      ...productsWithQuantity.map((product) => ({
        price_data: {
          currency: "usd",
          product_data: {
            name: product.name,
            images: [product?.images?.[0] as string]
          },
          unit_amount:
            typeof product.default_price === "object"
              ? product?.default_price?.unit_amount || 0
              : 0,
        },
        quantity: product.quantity,
      })),
    ],
    mode: "payment",
    success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/success`,
    cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/cart`,
  });
  return sessionStripe.url;
}
