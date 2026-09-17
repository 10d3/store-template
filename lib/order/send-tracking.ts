/* eslint-disable @typescript-eslint/no-explicit-any */
import type { ReactElement } from "react";
import { prisma } from "../prisma";
import { sendEmail } from "../action/send-email";
import { TrackingEmail } from "@/components/mails/tracking-email";

export interface TrackingEmailItem {
  name: string;
  quantity: number;
}

export interface SendTrackingEmailParams {
  customerEmail: string;
  customerName?: string;
  /** Customer-facing order number (shown in the email). */
  orderNumber: string;
  orderTotal: number;
  trackingNumber: string;
  trackingUrl?: string;
  carrier?: string;
  orderItems?: TrackingEmailItem[];
}

/**
 * Low-level: build + send the "your order shipped" email.
 * Shared by the manual admin tracking route and the automated CJ tracking sync.
 */
export async function sendTrackingEmail(
  params: SendTrackingEmailParams
): Promise<void> {
  const html = TrackingEmail({
    customerName: params.customerName ?? "Customer",
    orderId: params.orderNumber,
    orderTotal: params.orderTotal,
    trackingNumber: params.trackingNumber,
    trackingUrl: params.trackingUrl,
    carrier: params.carrier,
    orderItems: params.orderItems,
  });

  await sendEmail({
    to: params.customerEmail,
    subject: `Shipping Update: Order #${params.orderNumber}`,
    react: html as ReactElement,
  });
}

function itemsFromLineItems(raw: unknown): TrackingEmailItem[] {
  const arr = (Array.isArray(raw) ? raw : []) as any[];
  return arr.map((item) => ({
    name:
      item?.name ??
      item?.price_data?.product_data?.name ??
      item?.description ??
      "Product",
    quantity: item?.quantity ?? 1,
  }));
}

export interface SendTrackingUpdateInput {
  /** DB Order.id (e.g. the checkout session id). */
  orderId: string;
  trackingNumber: string;
  trackingUrl?: string;
  carrier?: string;
}

/**
 * High-level: look up a DB order and email the customer a tracking update.
 * Used by the CJ tracking sync (and any DB-order-based caller).
 */
export async function sendTrackingUpdate(
  input: SendTrackingUpdateInput
): Promise<{ ok: boolean; email?: string }> {
  const order = await prisma.order.findUnique({
    where: { id: input.orderId },
    select: {
      orderNumber: true,
      customerEmail: true,
      customerName: true,
      total: true,
      lineItems: true,
    },
  });

  if (!order) throw new Error(`Order ${input.orderId} not found`);
  if (!order.customerEmail) {
    return { ok: false };
  }

  await sendTrackingEmail({
    customerEmail: order.customerEmail,
    customerName: order.customerName ?? undefined,
    orderNumber: order.orderNumber,
    orderTotal: order.total,
    trackingNumber: input.trackingNumber,
    trackingUrl: input.trackingUrl,
    carrier: input.carrier,
    orderItems: itemsFromLineItems(order.lineItems),
  });

  return { ok: true, email: order.customerEmail };
}
