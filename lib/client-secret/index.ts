/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
// import { getCachedProducts } from "../product/cache";
import { CartCoupon, CartItem } from "../store";
import { stripeClient } from "../stripe";

export async function testPaymentIntend() {
  const paymentIntent = await stripeClient.paymentIntents.create({
    amount: 1000,
    currency: "usd",
    automatic_payment_methods: {
      enabled: true,
    },
  });
  return paymentIntent.client_secret as string
}
// export async function createPaymentIntent(
//   customerId: string,
//   cartItems: CartItem[],
//   coupon?: CartCoupon
// ) {
//   const products = await getCachedProducts();
//   // always check prices in server... never trust client data

//   const productIds = cartItems.map((item) => item.id);
//   const productsFromServer = products.filter((product) =>
//     productIds.includes(product.id)
//   );
//   console.log(productsFromServer)
//   const amount = productsFromServer.reduce(
//     (sum, item) => sum + item.price * item.quantity,
//     0
//   );
//   const paymentIntent = await stripeClient.paymentIntents.create({
//     amount,
//     customer: customerId,
//     currency: "usd",
//     automatic_payment_methods: {
//       enabled: true,
//     },
//     metadata: {
//       cartItems: JSON.stringify(
//         cartItems.map((item) => ({
//           id: item.id,
//           name: item.name,
//           quantity: item.quantity,
//           price: item.price,
//         }))
//       ),
//       coupon_code: coupon?.id || "none",
//       total_items: cartItems.length.toString(),
//       created_at: new Date().toISOString(),
//     },
//   });
//   return paymentIntent.client_secret;
// }

interface PaymentIntentParams {
  amount: number;
  cart: CartItem[];
  coupon?: CartCoupon;
  currency?: string;
  customerId?: string;
  metadata?: Record<string, string>;
}

interface PaymentResponse {
  success: boolean;
  clientSecret?: string;
  paymentIntentId?: string;
  status?: string;
  error?: string;
}

export async function createPaymentIntent(
  params: PaymentIntentParams
): Promise<PaymentResponse> {
  try {
    const { amount, cart, coupon, currency = "usd", customerId } = params;

    console.log("🆕 Creating new payment intent...");

    if (amount < 50) {
      return {
        success: false,
        error: "Amount too small. Minimum $0.50 required.",
      };
    }

    const paymentIntent = await stripeClient.paymentIntents.create({
      amount,
      currency,
      customer: customerId,
      automatic_payment_methods: { enabled: true },
      metadata: {
        cart_items: JSON.stringify(
          cart.map((item) => ({
            id: item.id,
            name: item.name,
            quantity: item.quantity,
            price: item.price,
          }))
        ),
        coupon_code: coupon?.id || "none",
        total_items: cart.length.toString(),
        created_at: new Date().toISOString(),
      },
      description: `Order for ${cart.length} items`,
    });

    return {
      success: true,
      clientSecret: paymentIntent.client_secret!,
      paymentIntentId: paymentIntent.id,
      status: paymentIntent.status,
    };
  } catch (error) {
    console.error("❌ Error creating payment intent:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to create payment intent",
    };
  }
}

export async function updatePaymentIntent(
  paymentIntentId: string,
  params: PaymentIntentParams
): Promise<PaymentResponse> {
  try {
    const { amount, cart, coupon } = params;

    console.log("🔄 Updating payment intent...", paymentIntentId);

    if (amount < 50) {
      return {
        success: false,
        error: "Amount too small. Minimum $0.50 required.",
      };
    }

    // Check current status first
    const currentPI =
      await stripeClient.paymentIntents.retrieve(paymentIntentId);

    // Can only update if payment hasn't been processed
    if (
      ![
        "requires_payment_method",
        "requires_confirmation",
        "requires_action",
      ].includes(currentPI.status)
    ) {
      console.warn(
        "⚠️ Cannot update payment intent in status:",
        currentPI.status
      );

      // Create new payment intent instead
      return createPaymentIntent(params);
    }

    const updatedPaymentIntent = await stripeClient.paymentIntents.update(
      paymentIntentId,
      {
        amount,
        metadata: {
          cart_items: JSON.stringify(
            cart.map((item) => ({
              id: item.id,
              name: item.name,
              quantity: item.quantity,
              price: item.price,
            }))
          ),
          coupon_code: coupon?.id || "none",
          total_items: cart.length.toString(),
          updated_at: new Date().toISOString(),
        },
        description: `Order for ${cart.length} items (updated)`,
      }
    );

    return {
      success: true,
      clientSecret: updatedPaymentIntent.client_secret!,
      paymentIntentId: updatedPaymentIntent.id,
      status: updatedPaymentIntent.status,
    };
  } catch (error) {
    console.error("❌ Error updating payment intent:", error);

    // If update fails, try creating new one
    if (
      error instanceof Error &&
      error.message.includes("No such payment_intent")
    ) {
      console.log("🔄 Payment intent not found, creating new one...");
      return createPaymentIntent(params);
    }

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to update payment intent",
    };
  }
}

export async function confirmPaymentIntent(
  paymentIntentId: string,
  paymentMethodId?: string
): Promise<PaymentResponse> {
  try {
    console.log("✅ Confirming payment intent...", paymentIntentId);

    const confirmParams: any = {
      return_url: `${process.env.NEXT_PUBLIC_BASE_URL}/checkout/success`,
    };

    if (paymentMethodId) {
      confirmParams.payment_method = paymentMethodId;
    }

    const confirmedPaymentIntent = await stripeClient.paymentIntents.confirm(
      paymentIntentId,
      confirmParams
    );

    return {
      success: true,
      clientSecret: confirmedPaymentIntent.client_secret!,
      paymentIntentId: confirmedPaymentIntent.id,
      status: confirmedPaymentIntent.status,
    };
  } catch (error) {
    console.error("❌ Error confirming payment intent:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to confirm payment",
    };
  }
}

export async function cancelPaymentIntent(
  paymentIntentId: string
): Promise<PaymentResponse> {
  try {
    console.log("❌ Canceling payment intent...", paymentIntentId);

    const canceledPaymentIntent =
      await stripeClient.paymentIntents.cancel(paymentIntentId);

    return {
      success: true,
      paymentIntentId: canceledPaymentIntent.id,
      status: canceledPaymentIntent.status,
    };
  } catch (error) {
    console.error("❌ Error canceling payment intent:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to cancel payment intent",
    };
  }
}

export async function getPaymentIntentStatus(
  paymentIntentId: string
): Promise<PaymentResponse> {
  try {
    console.log("🔍 Getting payment intent status...", paymentIntentId);

    const paymentIntent =
      await stripeClient.paymentIntents.retrieve(paymentIntentId);

    return {
      success: true,
      clientSecret: paymentIntent.client_secret!,
      paymentIntentId: paymentIntent.id,
      status: paymentIntent.status,
    };
  } catch (error) {
    console.error("❌ Error retrieving payment intent:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to retrieve payment intent",
    };
  }
}

export async function managePaymentIntent(
  params: PaymentIntentParams & {
    existingPaymentIntentId?: string;
  }
): Promise<PaymentResponse> {
  const { existingPaymentIntentId, ...paymentParams } = params;

  try {
    // If no existing PI, create new one
    if (!existingPaymentIntentId) {
      console.log("🆕 No existing payment intent, creating new...");
      return createPaymentIntent(paymentParams);
    }

    // Check status of existing PI
    const statusResult = await getPaymentIntentStatus(existingPaymentIntentId);

    if (!statusResult.success) {
      console.log("🆕 Existing PI not found, creating new...");
      return createPaymentIntent(paymentParams);
    }

    const status = statusResult.status;

    switch (status) {
      case "requires_payment_method":
      case "requires_confirmation":
      case "requires_action":
        // Can update these statuses
        console.log("🔄 Updating existing payment intent...");
        return updatePaymentIntent(existingPaymentIntentId, paymentParams);

      case "processing":
      case "requires_capture":
        // Don't modify, return existing
        console.log("⏳ Payment in progress, returning existing...");
        return statusResult;

      case "succeeded":
      case "canceled":
      default:
        // Create new PI for completed/failed payments
        console.log("🆕 Payment completed/failed, creating new...");
        return createPaymentIntent(paymentParams);
    }
  } catch (error) {
    console.error("❌ Error managing payment intent:", error);
    return createPaymentIntent(paymentParams);
  }
}

// Helper: Clean up old payment intents (optional background task)
export async function cleanupPaymentIntents(olderThanHours: number = 24) {
  // "use server";

  try {
    const cutoffTime = Math.floor(
      (Date.now() - olderThanHours * 60 * 60 * 1000) / 1000
    );

    const paymentIntents = await stripeClient.paymentIntents.list({
      created: { lte: cutoffTime },
      limit: 100,
    });

    let canceled = 0;

    for (const pi of paymentIntents.data) {
      if (
        pi.status === "requires_payment_method" ||
        pi.status === "requires_confirmation"
      ) {
        try {
          await stripeClient.paymentIntents.cancel(pi.id);
          canceled++;
        } catch (error) {
          console.warn("Failed to cancel PI:", pi.id);
        }
      }
    }

    console.log(`🧹 Cleaned up ${canceled} old payment intents`);
    return { success: true, canceled };
  } catch (error) {
    console.error("❌ Error cleaning up payment intents:", error);
    return { success: false, error: "Cleanup failed" };
  }
}
