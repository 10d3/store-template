/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { getStripeClient } from "@/lib/stripe";
import { sendOrderStatusEmail } from "@/lib/email/order-emails";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";

// Helper to find local order by Stripe ID (PaymentIntent or Session)
async function getLocalOrder(stripeId: string) {
  try {
    const stripe = getStripeClient();

    // 1. Try to find by PaymentIntent ID directly (if stored as ID)
    let order = await prisma.order.findUnique({
      where: { id: stripeId },
      include: { user: true }
    });

    if (order) return order;

    // 2. Try to find via Checkout Session (common if created via Checkout)
    const sessions = await stripe.checkout.sessions.list({
      payment_intent: stripeId,
      limit: 1
    });

    if (sessions.data.length > 0) {
      const sessionId = sessions.data[0].id;
      order = await prisma.order.findUnique({
        where: { id: sessionId },
        include: { user: true }
      });
    }

    return order;
  } catch (error) {
    console.warn("Error fetching local order:", error);
    return null;
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let orderId: string | undefined;
  try {
    const { action, reason, fulfillmentStatus } = await request.json();
    const { id } = await params;
    orderId = id;
    const stripe = getStripeClient();

    let result;
    let emailData: any = {};

    // Always try to get the local order to provide better email data (friendly ID, items)
    const localOrder = await getLocalOrder(orderId);

    // Prepare common email data from local order if available
    if (localOrder) {
      emailData.orderId = localOrder.orderNumber?.toString();
      emailData.customerEmail = localOrder.customerEmail;
      emailData.customerName = localOrder.customerName;

      // Parse line items if they exist
      if (localOrder.lineItems) {
        try {
          const parsedItems = typeof localOrder.lineItems === 'string'
            ? JSON.parse(localOrder.lineItems)
            : localOrder.lineItems;

          // Map to the format expected by email templates
          if (Array.isArray(parsedItems)) {
            emailData.orderItems = parsedItems.map((item: any) => ({
              name: item.description || item.name || "Product",
              quantity: item.quantity || 1,
              price: item.amount_total ? (item.amount_total / 100) / (item.quantity || 1) : 0,
              image: item.image || item.images?.[0]
            }));
          }
        } catch (e) {
          console.warn("Failed to parse local order line items:", e);
        }
      }
    }

    switch (action) {
      case "update_status":
        // Update the fulfillment status in metadata
        result = await stripe.paymentIntents.update(orderId, {
          metadata: {
            fulfillment_status: fulfillmentStatus
          }
        });

        emailData = {
          ...emailData,
          orderStatus: fulfillmentStatus,
          orderTotal: result.amount / 100,
          customerEmail: result.receipt_email, // Will define fallback below
          // Use Stripe ID as fallback if local ID missing
          orderId: emailData.orderId || result.id
        };
        break;

      case "cancel":
        result = await stripe.paymentIntents.cancel(orderId, {
          cancellation_reason: "requested_by_customer"
        });

        emailData = {
          ...emailData,
          orderStatus: "cancelled",
          orderTotal: result.amount / 100,
          customerEmail: result.receipt_email,
          orderId: emailData.orderId || result.id
        };
        break;

      case "refund":
        // First get the payment intent to find the charge
        const paymentIntent = await stripe.paymentIntents.retrieve(orderId);
        const charges = await stripe.charges.list({
          payment_intent: orderId,
          limit: 1
        });

        if (charges.data.length === 0) {
          return NextResponse.json(
            { error: "No charges found for this payment intent" },
            { status: 400 }
          );
        }

        result = await stripe.refunds.create({
          charge: charges.data[0].id,
          reason: reason || "requested_by_customer"
        });

        emailData = {
          ...emailData,
          orderStatus: "refunded",
          orderTotal: paymentIntent.amount / 100,
          refundAmount: result.amount / 100,
          customerEmail: paymentIntent.receipt_email,
          orderId: emailData.orderId || paymentIntent.id
        };
        break;

      case "capture":
        result = await stripe.paymentIntents.capture(orderId);

        emailData = {
          ...emailData,
          orderStatus: "completed",
          orderTotal: result.amount / 100,
          customerEmail: result.receipt_email,
          orderId: emailData.orderId || result.id
        };
        break;

      default:
        return NextResponse.json(
          { error: "Invalid action" },
          { status: 400 }
        );
    }

    // --- Customer Email Fallback Logic ---
    if (!emailData.customerEmail) {
      // 1. Try Stripe Customer
      // Cast to any because 'result' can be a Refund object which doesn't have 'customer'
      if ((result as any).customer) {
        try {
          const customerId = typeof (result as any).customer === 'string'
            ? (result as any).customer
            : (result as any).customer.id;

          const customer = await stripe.customers.retrieve(customerId);
          if (!customer.deleted && customer.email) {
            emailData.customerEmail = customer.email;
          }
        } catch (e) {
          console.warn("Failed to fetch Stripe customer for email:", e);
        }
      }

      // 2. Try Local User
      if (!emailData.customerEmail && localOrder?.user?.email) {
        emailData.customerEmail = localOrder.user.email;
      }
    }

    // Send email notification if we have customer email
    if (emailData?.customerEmail) {
      try {
        await sendOrderStatusEmail(emailData);
      } catch (emailError) {
        console.error("Failed to send email notification:", emailError);
        // Don't fail the request if email fails
      }
    }

    return NextResponse.json({
      success: true,
      data: result,
      message: `Order ${action} successful`
    });

  } catch (error: any) {
    console.error(`Error processing order ${orderId || 'unknown'}:`, error);

    if (error.type === "StripeCardError") {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to process order action" },
      { status: 500 }
    );
  }
}


export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let orderId: string | undefined;
  try {
    const { id } = await params;
    orderId = id;
    const stripe = getStripeClient();

    // Get the payment intent with expanded data
    const paymentIntent = await stripe.paymentIntents.retrieve(orderId, {
      expand: ["charges"]
    });

    // Type assertion for expanded PaymentIntent with charges
    const expandedPaymentIntent = paymentIntent as Stripe.PaymentIntent & {
      charges?: {
        data: Stripe.Charge[];
      };
    };

    // Get customer details if available
    let customerEmail = paymentIntent.receipt_email;
    let customerName = null;
    let customerDetails = null;

    if (paymentIntent.customer && typeof paymentIntent.customer === "string") {
      try {
        const customer = await stripe.customers.retrieve(paymentIntent.customer);
        if (customer && !customer.deleted) {
          customerEmail = customer.email || customerEmail;
          customerName = customer.name;
          customerDetails = {
            id: customer.id,
            email: customer.email,
            name: customer.name,
            phone: customer.phone,
            address: customer.address
          };
        }
      } catch (error) {
        console.warn(`Failed to fetch customer ${paymentIntent.customer}:`, error);
      }
    }

    // Get line items if this was a checkout session
    let lineItems: Stripe.LineItem[] = [];
    if (paymentIntent.metadata?.checkout_session_id) {
      try {
        const session = await stripe.checkout.sessions.retrieve(
          paymentIntent.metadata.checkout_session_id,
          { expand: ["line_items.data.price.product"] }
        );
        lineItems = session.line_items?.data || [];
      } catch (error) {
        console.warn(`Failed to fetch line items for session ${paymentIntent.metadata.checkout_session_id}:`, error);
      }
    }

    // Get refunds if any
    let refunds: any[] = [];
    if (expandedPaymentIntent.charges?.data && expandedPaymentIntent.charges.data.length > 0) {
      const refundsList = await stripe.refunds.list({
        charge: expandedPaymentIntent.charges.data[0].id
      });
      refunds = refundsList.data;
    }

    // Also try to find a local order number to display
    let localOrderNumber = null;
    const localOrder = await getLocalOrder(orderId);
    if (localOrder) {
      localOrderNumber = localOrder.orderNumber;
      if (localOrder.customerEmail) {
        customerEmail = localOrder.customerEmail;
      }
      if (localOrder.customerName) {
        customerName = localOrder.customerName;
      }
    }

    const order = {
      id: paymentIntent.id,
      friendlyId: localOrderNumber, // Exposed for frontend use
      amount: paymentIntent.amount / 100,
      currency: paymentIntent.currency.toUpperCase(),
      status: paymentIntent.status,
      fulfillmentStatus: paymentIntent.metadata?.fulfillment_status || "pending",
      customerEmail,
      customerName,
      customerDetails,
      description: paymentIntent.description,
      created: new Date(paymentIntent.created * 1000),
      metadata: paymentIntent.metadata,
      lineItems,
      paymentMethod: paymentIntent.payment_method_types?.[0] || "unknown",
      receiptUrl: expandedPaymentIntent.charges?.data?.[0]?.receipt_url,
      refunds: refunds.map((refund: any) => ({
        id: refund.id,
        amount: refund.amount / 100,
        reason: refund.reason,
        status: refund.status,
        created: new Date(refund.created * 1000)
      })),
      charges: expandedPaymentIntent.charges?.data?.map((charge: any) => ({
        id: charge.id,
        amount: charge.amount / 100,
        status: charge.status,
        created: new Date(charge.created * 1000),
        receiptUrl: charge.receipt_url,
        balanceTransaction: charge.balance_transaction
      })) || []
    };

    return NextResponse.json({ order });

  } catch (error) {
    console.error("Error fetching order details:", error);
    return NextResponse.json(
      { error: "Failed to fetch order details" },
      { status: 500 }
    );
  }
}