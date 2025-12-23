import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/action/send-email";
import { TrackingEmail } from "@/components/mails/tracking-email";
import { getStripeClient } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session || session.user.role !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const body = await req.json();
        const { trackingNumber, trackingUrl, carrier } = body;

        if (!trackingNumber) {
            return NextResponse.json(
                { error: "Tracking number is required" },
                { status: 400 }
            );
        }

        // Fetch order from Stripe directly since Admin panel lists PaymentIntents
        const stripe = getStripeClient();
        let paymentIntent;

        try {
            paymentIntent = await stripe.paymentIntents.retrieve(id);
        } catch (stripeError) {
            console.error("Stripe retrieve error:", stripeError);
            return NextResponse.json({ error: "Order not found in Stripe" }, { status: 404 });
        }

        // Determine the email to send to
        let customerEmail = paymentIntent.receipt_email || (paymentIntent.metadata && paymentIntent.metadata.email);

        // If email is still missing, try to fetch it from the Customer object
        if (!customerEmail && paymentIntent.customer) {
            try {
                const customerId = typeof paymentIntent.customer === 'string'
                    ? paymentIntent.customer
                    : paymentIntent.customer.id;

                if (customerId) {
                    const customer = await stripe.customers.retrieve(customerId);
                    if (!customer.deleted && customer.email) {
                        customerEmail = customer.email;
                    }
                }
            } catch (customerError) {
                console.error("Failed to fetch Stripe customer:", customerError);
            }
        }

        if (!customerEmail) {
            return NextResponse.json(
                { error: "No customer email found for this order" },
                { status: 400 }
            );
        }

        // Parse lineItems if it's stored in metadata
        let orderItems = [];
        try {
            if (paymentIntent.metadata?.line_items) {
                orderItems = JSON.parse(paymentIntent.metadata.line_items);
            }
        } catch (e) {
            console.error("Failed to parse line items from metadata", e);
        }

        // Try to find the friendly order number in our database
        let friendlyOrderId = paymentIntent.id.slice(-8); // Fallback to last 8 chars of Stripe ID usually

        try {
            const dbOrder = await prisma.order.findUnique({
                where: { id: paymentIntent.id },
                select: { orderNumber: true }
            });

            if (dbOrder?.orderNumber) {
                friendlyOrderId = dbOrder.orderNumber.toString();
            }
        } catch (dbError) {
            console.error("Failed to fetch order number from DB:", dbError);
        }

        const emailHtml = TrackingEmail({
            customerName: paymentIntent.shipping?.name || "Customer",
            orderId: friendlyOrderId,
            orderTotal: paymentIntent.amount / 100,
            trackingNumber,
            trackingUrl,
            carrier,
            orderItems,
        });

        await sendEmail({
            to: customerEmail,
            subject: `Shipping Update: Order #${friendlyOrderId}`,
            react: emailHtml as any,
        });

        // Optionally update Stripe metadata to store tracking info
        try {
            await stripe.paymentIntents.update(id, {
                metadata: {
                    tracking_number: trackingNumber,
                    tracking_url: trackingUrl || "",
                    carrier: carrier || ""
                }
            });
        } catch (updateError) {
            console.error("Failed to update Stripe metadata with tracking info:", updateError);
            // Don't fail the request if just metadata update fails, as email is sent
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Send tracking email error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
