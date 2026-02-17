"use server";
import { cookies, headers } from "next/headers";
import { auth } from "../auth";
import { getCachedProducts } from "../product/cache";
import { CartItem } from "../store";
import { prisma } from "../prisma";
import { stripeClient } from "../stripe";

export async function createCheckoutSession(cart: CartItem[]) {
  const session = await auth.api.getSession({ headers: await headers() });
  console.log("createCheckoutSession: session found?", !!session);
  if (!session) {
    console.error("createCheckoutSession: No session found");
    throw new Error("No session found");
  }
  const cookiesStore = await cookies();
  const referralCode = cookiesStore.get("referral_code")?.value || null;
  console.log(referralCode)
  const line_items = cart.map((item) => ({
    price_data: {
      currency: "usd",
      product_data: {
        id: item.id,
        name: item.name,
        images: [item?.image as string],
      },
      unit_amount: item.price
    },
    quantity: item.quantity,
  }));

  const productIds = cart.map((item) => item.id);
  const productsFromStripe = await getCachedProducts();
  const products = productsFromStripe.filter((product) =>
    productIds.includes(product.id)
  );
  const productsWithQuantity = products.map((product) => ({
    ...product,
    quantity: cart.find((item) => item.id === product.id)?.quantity || 1,
  }));

  console.log("createCheckoutSession: referralCode", referralCode);
  let stripeCustomerId = session.user.stripeCustomerId;

  // Verify stripeCustomerId exists, if not create it
  if (!stripeCustomerId) {
    console.log("createCheckoutSession: No stripeCustomerId found on session, fetching from DB...");
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { stripeCustomerId: true, email: true, name: true }
    });

    if (user?.stripeCustomerId) {
      stripeCustomerId = user.stripeCustomerId;
    } else {
      console.log("createCheckoutSession: No stripeCustomerId in DB, creating new customer...");
      const customer = await stripeClient.customers.create({
        email: user?.email || session.user.email,
        name: user?.name || session.user.name,
        metadata: {
          userId: session.user.id,
        }
      });
      stripeCustomerId = customer.id;

      await prisma.user.update({
        where: { id: session.user.id },
        data: { stripeCustomerId: customer.id }
      });
      console.log("createCheckoutSession: Created new customer", customer.id);
    }
  }

  try {
    const sessionStripe = await stripeClient.checkout.sessions.create({
      payment_method_types: ["card", "link", "sepa_debit"],
      customer: stripeCustomerId as string,
      line_items: [
        ...productsWithQuantity.map((product) => ({
          price_data: {
            currency: "usd",
            product_data: {
              name: product.name,
              images: [product?.images?.[0] as string],
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
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}`,
      metadata: {
        userId: session.user.id,
        // Optional: add more metadata if needed
        line_items: JSON.stringify(line_items),
        referralCode
      },
    });

    return sessionStripe.url;
  } catch (error) {
    console.error("createCheckoutSession: Error creating Stripe session:", error);
    throw error;
  }
}

export async function createCheckoutSessionNow(product: CartItem) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    throw new Error("No session found");
  }
  const cookiesStore = await cookies();
  const referralCode = cookiesStore.get("referral_code")?.value || null;
  console.log(referralCode)

  const line_items = {
    price_data: {
      currency: "usd",
      product_data: {
        name: product.name,
        images: [product?.image as string],
        // Remove the 'id' field - it's not allowed here
        // Optionally add metadata to track your internal product ID
        metadata: {
          product_id: product.id
        }
      },
      unit_amount: product.price
    },
    quantity: product.quantity,
  }

  let stripeCustomerId = session.user.stripeCustomerId;

  // Verify stripeCustomerId exists, if not create it
  if (!stripeCustomerId) {
    console.log("createCheckoutSession: No stripeCustomerId found on session, fetching from DB...");
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { stripeCustomerId: true, email: true, name: true }
    });

    if (user?.stripeCustomerId) {
      stripeCustomerId = user.stripeCustomerId;
    } else {
      console.log("createCheckoutSession: No stripeCustomerId in DB, creating new customer...");
      const customer = await stripeClient.customers.create({
        email: user?.email || session.user.email,
        name: user?.name || session.user.name,
        metadata: {
          userId: session.user.id,
        }
      });
      stripeCustomerId = customer.id;

      await prisma.user.update({
        where: { id: session.user.id },
        data: { stripeCustomerId: customer.id }
      });
      console.log("createCheckoutSession: Created new customer", customer.id);
    }
  }

  const sessionStripe = await stripeClient.checkout.sessions.create({
    payment_method_types: ["card", "link", "sepa_debit"],
    customer: stripeCustomerId as string,
    line_items: [line_items],
    mode: "payment",
    success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/success`,
    cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}`,
    metadata: {
      userId: session.user.id,
      line_items: JSON.stringify(line_items),
      referralCode
    },
  });

  return sessionStripe.url;
}