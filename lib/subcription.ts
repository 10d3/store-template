/* eslint-disable @typescript-eslint/no-explicit-any */
import Stripe from "stripe";
import { prisma } from "./prisma";
import { trackPurchase } from "./affiliation/track-purshase";
import {
  syncProductToDatabase,
  deleteProductFromDatabase,
  syncPriceToDatabase,
  deletePriceFromDatabase,
} from "./product/product-sync";
import { sendOrderStatusEmail } from "./email/order-emails";

export default async function handleSubscription(payload: Stripe.Event) {
  const { type, data } = payload;

  switch (type) {
    case "invoice.paid":
      break;

    case "checkout.session.completed":
      // console.log("Checkout session completed:", data.object);
      await handleCheckoutCompletedSession(data.object);
      break;

    case "transfer.created":
      await handleTransferCreated(data.object);
      break;

    // case "payment_intent.succeeded":
    //   await handlePaymentIntentSucceeded(data.object);
    //   break;

    case "payment_intent.payment_failed":
      await handlePaymentIntentFailed(data.object);
      break;

    // ============ PRODUCT SYNC WEBHOOKS ============
    case "product.created":
    case "product.updated":
      await syncProductToDatabase(data.object as Stripe.Product);
      break;

    case "product.deleted":
      await deleteProductFromDatabase((data.object as Stripe.Product).id);
      break;

    case "price.created":
    case "price.updated":
      await syncPriceToDatabase(data.object as Stripe.Price);
      break;

    case "price.deleted":
      await deletePriceFromDatabase((data.object as Stripe.Price).id);
      break;
  }
}

// async function handlePaymentIntentSucceeded(
//   paymentIntent: Stripe.PaymentIntent
// ) {
//   console.log("Payment succeeded:", paymentIntent);

//   try {
//     // Track affiliate purchase if referral exists
//     if (paymentIntent.metadata?.line_items) {
//       const lineItems = JSON.parse(paymentIntent.metadata.line_items);

//       // Track each product in the order
//       for (const item of lineItems) {
//         try {
//           // Calculate individual item total
//           const itemTotal = (item.price * item.quantity) / 100;

//           await trackPurchase({
//             userId: paymentIntent.metadata?.user_id || "",
//             email: paymentIntent.receipt_email || "",
//             orderValue: itemTotal,
//             orderId: paymentIntent.id,
//             productId: item.id,
//             productName: item.name,
//           });
//         } catch (error) {
//           // Log error but continue processing other items
//           console.error(
//             `Affiliate tracking failed for product ${item.id}:`,
//             error
//           );
//         }
//       }
//     }

//     const user = await prisma.user.findUnique({
//       where: { stripeCustomerId: paymentIntent.customer as string },
//     });
//     // Update or create order in database
//     await prisma.order.upsert({
//       where: { id: paymentIntent.id },
//       update: {
//         status: "completed",
//         updatedAt: new Date(),
//         metadata: {
//           ...paymentIntent.metadata,
//           stripe_status: paymentIntent.status,
//           webhook_processed_at: new Date().toISOString(),
//         },
//       },
//       create: {
//         id: paymentIntent.id,
//         userId: user?.id as string,
//         total: paymentIntent.amount / 100,
//         status: "completed",
//         lineItems: paymentIntent.metadata?.line_items
//           ? JSON.parse(paymentIntent.metadata.line_items)
//           : [],
//         shippingAddress: paymentIntent.shipping?.address
//           ? JSON.stringify(paymentIntent.shipping.address)
//           : null,
//         metadata: {
//           ...paymentIntent.metadata,
//           stripe_status: paymentIntent.status,
//           webhook_processed_at: new Date().toISOString(),
//         },
//         createdAt: new Date(paymentIntent.created * 1000),
//         updatedAt: new Date(),
//       },
//     });

//     // Send confirmation email (implement this based on your email service)
//     // await sendOrderConfirmationEmail(paymentIntent);
//   } catch (error) {
//     console.error("Error handling payment success:", error);
//   }
// }

async function handlePaymentIntentFailed(paymentIntent: any) {
  console.log("Payment failed:", paymentIntent.id);

  try {
    await prisma.order.upsert({
      where: { id: paymentIntent.id },
      update: {
        status: "failed",
        updatedAt: new Date(),
        metadata: {
          ...paymentIntent.metadata,
          stripe_status: paymentIntent.status,
          failure_reason: paymentIntent.last_payment_error?.message,
          webhook_processed_at: new Date().toISOString(),
        },
      },
      create: {
        id: paymentIntent.id,
        userId: paymentIntent.metadata?.user_id || "unknown",
        total: paymentIntent.amount / 100,
        status: "failed",
        lineItems: paymentIntent.metadata?.line_items
          ? JSON.parse(paymentIntent.metadata.line_items)
          : [],
        metadata: {
          ...paymentIntent.metadata,
          stripe_status: paymentIntent.status,
          failure_reason: paymentIntent.last_payment_error?.message,
          webhook_processed_at: new Date().toISOString(),
        },
        createdAt: new Date(paymentIntent.created * 1000),
        updatedAt: new Date(),
      },
    });
  } catch (error) {
    console.error("Error handling payment failure:", error);
  }
}

async function handleCheckoutCompletedSession(data: Stripe.Checkout.Session) {
  console.log("Checkout completed session:", data);
  try {
    if (data.metadata?.line_items) {
      const lineItems = JSON.parse(data.metadata.line_items);

      // Track each product in the order
      for (const item of lineItems) {
        try {
          // Calculate individual item total
          const itemTotal =
            ((item.price_data?.unit_amount || 0) * (item.quantity || 0)) / 100;

          await trackPurchase({
            userId: data.metadata?.userId || "",
            email: data.customer_details?.email || "",
            orderValue: itemTotal,
            orderId: data.id,
            productId: item.price_data?.product_data?.id as string,
            productName: item.price_data?.product_data?.name as string,
            referralCode: data.metadata?.referralCode || null,
          });
        } catch (error) {
          // Log error but continue processing other items
          console.error(
            `Affiliate tracking failed for product ${item.price_data?.product_data?.id}:`,
            error
          );
        }
      }
    }
    const order = await prisma.order.upsert({
      where: { id: data.id },
      update: {
        status: "completed",
        updatedAt: new Date(),
        metadata: {
          ...data.metadata,
          stripe_status: data.status,
          webhook_processed_at: new Date().toISOString(),
        },
      },
      create: {
        id: data.id,
        userId: data?.metadata?.userId as string,
        total: data?.amount_total ? data.amount_total / 100 : 0,
        status: "completed",
        lineItems: data?.metadata?.line_items
          ? JSON.parse(data.metadata.line_items)
          : [],
        shippingAddress: data?.shipping_address_collection
          ? JSON.stringify(data.shipping_address_collection)
          : null,
        metadata: {
          ...data.metadata,
          stripe_status: data.status,
          webhook_processed_at: new Date().toISOString(),
        },
        createdAt: new Date(data.created * 1000),
        updatedAt: new Date(),
      },
    });

    // Prepare items with images for email
    let orderItems: any[] = [];
    if (data.metadata?.line_items) {
      try {
        let rawItems = JSON.parse(data.metadata.line_items);
        if (!Array.isArray(rawItems)) {
          rawItems = [rawItems];
        }

        if (Array.isArray(rawItems)) {
          orderItems = rawItems.map((item: any) => ({
            name: item.name || item.price_data?.product_data?.name || item.description || item.title || "Product",
            quantity: item.quantity || 1,
            price: item.price_data?.unit_amount ? (item.price_data.unit_amount / 100) : (item.amount_total ? (item.amount_total / 100) / (item.quantity || 1) : 0),
            image: item.image || item.price_data?.product_data?.images?.[0] || item.images?.[0]
          }));
        }
      } catch (e) {
        console.error("Error parsing items for email:", e);
      }
    }

    // Send confirmation email
    await sendOrderStatusEmail({
      customerEmail: data.customer_details?.email || "",
      customerName: data.customer_details?.name || "Customer",
      orderId: order.orderNumber.toString(), // Use friendly ID from DB
      orderTotal: data.amount_total ? data.amount_total / 100 : 0,
      orderStatus: "completed",
      orderItems: orderItems,
    });

  } catch (error) {
    console.error("Error handling checkout completed session:", error);
  }
}

async function handleTransferCreated(transfer: Stripe.Transfer) {
  console.log("Transfer created:", transfer);
  try {
    const result = await prisma.payout.create({
      data: {
        affiliateId: transfer.metadata.affiliateId as string,
        amount: transfer.amount / 100,
        method: "STRIPE",
        status: "COMPLETED",
        transactionId: transfer.id,
        notes: transfer.description
      },
    });
    // Update affiliate balance
    await prisma.affiliate.update({
      where: { id: result.affiliateId },
      data: {
        availableBalance: {
          decrement: result.amount,
        },
      },
    });
  } catch (error) {
    console.error("Error handling transfer created:", error);
  }
}
