/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { getStripeClient } from "@/lib/stripe";
import { sendOrderStatusEmail } from "@/lib/email/order-emails";
import Stripe from "stripe";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { action, reason, fulfillmentStatus } = await request.json();
    const orderId = params.id;
    const stripe = getStripeClient();

    let result;
    let emailData;

    switch (action) {
      case "update_status":
        // Update the fulfillment status in metadata
        result = await stripe.paymentIntents.update(orderId, {
          metadata: {
            fulfillment_status: fulfillmentStatus
          }
        });

        // Get customer email for notification
        const customerEmail = result.receipt_email || "";
        if (customerEmail) {
          emailData = {
            customerEmail,
            orderId: result.id,
            orderTotal: result.amount / 100,
            orderStatus: fulfillmentStatus
          };
        }
        break;

      case "cancel":
        result = await stripe.paymentIntents.cancel(orderId, {
          cancellation_reason: "requested_by_customer"
        });
        
        emailData = {
          customerEmail: result.receipt_email || "",
          orderId: result.id,
          orderTotal: result.amount / 100,
          orderStatus: "cancelled"
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
          customerEmail: paymentIntent.receipt_email || "",
          orderId: paymentIntent.id,
          orderTotal: paymentIntent.amount / 100,
          orderStatus: "refunded",
          refundAmount: result.amount / 100
        };
        break;

      case "capture":
        result = await stripe.paymentIntents.capture(orderId);
        
        emailData = {
          customerEmail: result.receipt_email || "",
          orderId: result.id,
          orderTotal: result.amount / 100,
          orderStatus: "completed"
        };
        break;

      default:
        return NextResponse.json(
          { error: "Invalid action" },
          { status: 400 }
        );
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
    console.error(`Error processing order ${params.id}:`, error);
    
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
  { params }: { params: { id: string } }
) {
  try {
    const orderId = params.id;
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

    const order = {
      id: paymentIntent.id,
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