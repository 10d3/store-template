import { prisma } from "@/lib/prisma";
import type { Order, OrderLineItem } from "@/lib/generated/prisma";
import type { CustomerOrder, DisplayOrderItem, PublicOrderResult } from "./types";

/** Shape of an entry in the legacy `Order.lineItems` JSON mirror. */
interface LegacyLineItem {
  name?: string;
  title?: string;
  description?: string;
  image?: string;
  images?: string[];
  quantity?: number;
  unit_amount?: number;
  amount_total?: number;
  variantTitle?: string;
  price_data?: {
    unit_amount?: number;
    product_data?: {
      name?: string;
      images?: string[];
    };
  };
}

/**
 * Tolerantly parse the legacy `Order.lineItems` JSON mirror into entries.
 * Accepts a JSON string, an array, or a single object; anything else → [].
 */
function toLegacyEntries(raw: Order["lineItems"]): LegacyLineItem[] {
  let parsed: unknown = raw;

  if (typeof raw === "string") {
    try {
      parsed = JSON.parse(raw);
    } catch {
      return [];
    }
  }

  if (Array.isArray(parsed)) {
    return parsed as unknown as LegacyLineItem[];
  }

  if (parsed && typeof parsed === "object") {
    return [parsed as LegacyLineItem];
  }

  return [];
}

/** Normalize legacy line-item JSON into the shared display shape. */
function normalizeLegacyLineItems(raw: Order["lineItems"]): DisplayOrderItem[] {
  return toLegacyEntries(raw).map((item, index) => {
    const quantity = typeof item.quantity === "number" ? item.quantity : 1;

    const explicitUnit = item.price_data?.unit_amount ?? item.unit_amount;
    const unitPrice =
      typeof explicitUnit === "number"
        ? explicitUnit
        : typeof item.amount_total === "number" && quantity > 0
          ? Math.round(item.amount_total / quantity)
          : 0;

    const totalPrice =
      typeof item.amount_total === "number" ? item.amount_total : unitPrice * quantity;

    const image = item.image ?? item.price_data?.product_data?.images?.[0] ?? item.images?.[0];

    const productName =
      item.name ??
      item.price_data?.product_data?.name ??
      item.description ??
      item.title ??
      "Product";

    return {
      id: `legacy-${index}`,
      productName,
      variantTitle: item.variantTitle,
      image,
      unitPrice,
      quantity,
      totalPrice,
    };
  });
}

/**
 * Normalize an order's line items. Real `OrderLineItem` records win; legacy
 * JSON is the fallback for orders created before the migration.
 */
export function normalizeOrderLineItems(
  orderLineItems: OrderLineItem[],
  legacyLineItems: Order["lineItems"],
): DisplayOrderItem[] {
  if (orderLineItems.length > 0) {
    return orderLineItems.map((item) => ({
      id: item.id,
      productName: item.productName,
      variantTitle: item.variantTitle ?? undefined,
      image: item.image ?? undefined,
      unitPrice: item.unitPrice,
      quantity: item.quantity,
      totalPrice: item.totalPrice,
    }));
  }

  return normalizeLegacyLineItems(legacyLineItems);
}

/** Orders for a customer, with line items normalized for the client. */
export async function getOrdersWithItems(userId: string): Promise<CustomerOrder[]> {
  const orders = await prisma.order.findMany({
    where: { userId },
    include: { orderLineItems: true },
    orderBy: { createdAt: "desc" },
  });

  return orders.map((order) => ({
    ...order,
    lineItems: normalizeOrderLineItems(order.orderLineItems, order.lineItems),
  }));
}

/**
 * Public order lookup by order number, mirroring the ownership + email gating
 * of `lib/order.ts`, but with line items normalized.
 */
export async function getOrderByNumberPublicWithItems(
  orderNumber: string,
  email?: string,
): Promise<PublicOrderResult> {
  const order = await prisma.order.findUnique({
    where: { orderNumber },
    include: { orderLineItems: true },
  });

  if (!order) {
    return { order: null, requiresAuth: false };
  }

  const withItems: CustomerOrder = {
    ...order,
    lineItems: normalizeOrderLineItems(order.orderLineItems, order.lineItems),
  };

  if (order.userId) {
    return { order: withItems, requiresAuth: true };
  }

  const emailMatches = Boolean(email) && order.customerEmail === email;

  return {
    order: emailMatches ? withItems : null,
    requiresAuth: false,
    emailRequired: !emailMatches,
  };
}
