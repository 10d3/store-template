/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { getStripeClient } from "@/lib/stripe";
import Stripe from "stripe";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    
    const stripe = getStripeClient();

    // Build Stripe query parameters
    const queryParams: Stripe.PaymentIntentListParams = {
      limit: Math.min(limit * 2, 100), // Fetch more to account for filtering
      expand: ["data.charges"]
    };

    // For pagination, we'll use Stripe's starting_after parameter
    if (page > 1) {
      // This is a simplified pagination - in production you'd want to store cursor tokens
      const skipCount = (page - 1) * limit;
      if (skipCount > 0) {
        // Get previous page to find the starting_after cursor
        const prevPageParams = { ...queryParams, limit: skipCount };
        const prevResults = await stripe.paymentIntents.list(prevPageParams);
        if (prevResults.data.length > 0) {
          queryParams.starting_after = prevResults.data[prevResults.data.length - 1].id;
          queryParams.limit = limit * 2; // Fetch more for filtering
        }
      }
    }

    // Fetch payment intents from Stripe
    const paymentIntents = await stripe.paymentIntents.list(queryParams);

    // Transform Stripe data to order format
    let orders = paymentIntents.data.map(transformPaymentIntentToOrder);

    // Apply status filter if provided
    if (status && status !== "all") {
      orders = orders.filter(order => order.status === status);
    }

    // Apply search filter if provided (search by intent ID, receipt email, or description)
    if (search) {
      const searchLower = search.toLowerCase();
      orders = orders.filter(order => 
        order.id.toLowerCase().includes(searchLower) ||
        order.customerEmail?.toLowerCase().includes(searchLower) ||
        order.description?.toLowerCase().includes(searchLower)
      );
    }

    // Apply pagination to filtered results
    const startIndex = 0; // Since we're filtering, start from beginning
    const endIndex = limit;
    const paginatedOrders = orders.slice(startIndex, endIndex);

    // Calculate pagination info
    const hasMore = orders.length > limit;
    const totalCount = orders.length; // This is approximate since we're filtering

    return NextResponse.json({
      orders: paginatedOrders,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasMore
      }
    });

  } catch (error: any) {
    console.error("Error fetching orders:", error);
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}

// Helper function to transform Stripe Payment Intent to Order format
function transformPaymentIntentToOrder(intent: Stripe.PaymentIntent): any {
  // Type assertion for expanded PaymentIntent with charges
  const expandedIntent = intent as Stripe.PaymentIntent & {
    charges?: {
      data: Stripe.Charge[];
    };
  };

  return {
    id: intent.id,
    amount: intent.amount / 100, // Convert from cents
    currency: intent.currency.toUpperCase(),
    status: intent.status,
    fulfillmentStatus: intent.metadata?.fulfillment_status || "pending",
    customerEmail: intent.receipt_email,
    customerName: intent.shipping?.name || null,
    description: intent.description,
    created: new Date(intent.created * 1000),
    updated: new Date(intent.created * 1000), // Stripe doesn't have updated field
    metadata: intent.metadata,
    paymentMethod: intent.payment_method_types?.[0] || "unknown",
    receiptUrl: expandedIntent.charges?.data?.[0]?.receipt_url,
    shippingAddress: intent.shipping?.address ? {
      line1: intent.shipping.address.line1,
      line2: intent.shipping.address.line2,
      city: intent.shipping.address.city,
      state: intent.shipping.address.state,
      postal_code: intent.shipping.address.postal_code,
      country: intent.shipping.address.country,
    } : null,
    charges: expandedIntent.charges?.data || [],
    refunds: expandedIntent.charges?.data?.[0]?.refunds?.data || []
  };
}