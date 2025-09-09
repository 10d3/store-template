import { getCachedProducts } from "../product/cache";
import { CartItem } from "../store";
import { stripeClient } from "../stripe";

export async function createCheckoutSession(cart: CartItem[]) {
  const productIds = cart.map((item) => item.id);
  const productsFromStripe = await getCachedProducts();
  const products = productsFromStripe.filter((product) =>
    productIds.includes(product.id)
  );
  const productsWithQuantity = products.map((product) => ({
    ...product,
    quantity: cart.find((item) => item.id === product.id)?.quantity || 1,
  }));
  const session = await stripeClient.checkout.sessions.create({
    payment_method_types: ["card", "link", "sepa_debit"],
    customer: "",
    line_items: [
      ...productsWithQuantity.map((product) => ({
        price_data: {
          currency: "usd",
          product_data: {
            name: product.name,
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
    success_url: "https://example.com/success",
    cancel_url: "https://example.com/cancel",
  });
  return session;
}
