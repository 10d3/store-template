import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/lib/generated/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

type JsonObject = { [key: string]: unknown };

/** Narrow unknown JSON (Prisma JsonValue) to a plain object, or null. */
function asJsonObject(value: unknown): JsonObject | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as JsonObject)
    : null;
}

/** Read a string field out of a JSON blob without unsafe casts. */
function getMetaString(metadata: unknown, key: string): string | null {
  const value = asJsonObject(metadata)?.[key];
  return typeof value === "string" ? value : null;
}

/** Parse the stored shipping address JSON; null when absent or malformed. */
function parseShippingAddress(raw: string | null): unknown {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/** Fallback description derived from the typed line items. */
function buildDescription(lineItems: { productName: string }[]): string | null {
  if (lineItems.length === 0) return null;
  const [first, ...rest] = lineItems.map((li) => li.productName);
  return rest.length > 0
    ? `${first} + ${rest.length} more item${rest.length > 1 ? "s" : ""}`
    : first;
}

type OrderWithRelations = Prisma.OrderGetPayload<{
  include: { orderLineItems: true; fulfillments: true };
}>;

/** Map a Prisma Order into the admin UI's order shape. */
function transformOrder(order: OrderWithRelations) {
  const orderLineItems = order.orderLineItems.map((li) => ({
    id: li.id,
    productName: li.productName,
    variantTitle: li.variantTitle,
    sku: li.sku,
    image: li.image,
    unitPrice: li.unitPrice,
    quantity: li.quantity,
    totalPrice: li.totalPrice,
  }));

  return {
    id: order.id,
    amount: order.total, // dollars
    currency: "usd",
    status: order.status,
    fulfillmentStatus:
      order.fulfillments[0]?.status ??
      getMetaString(order.metadata, "fulfillment_status") ??
      "pending",
    customerEmail: order.customerEmail,
    customerName: order.customerName,
    description:
      getMetaString(order.metadata, "description") ??
      buildDescription(order.orderLineItems),
    created: order.createdAt,
    updated: order.updatedAt,
    metadata: order.metadata,
    paymentMethod: getMetaString(order.metadata, "payment_method"),
    receiptUrl: getMetaString(order.metadata, "receipt_url"),
    shippingAddress: parseShippingAddress(order.shippingAddress),
    charges: [],
    refunds: [],
    orderLineItems,
  };
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    const where: Prisma.OrderWhereInput = {
      ...(status && status !== "all" ? { status } : {}),
      ...(search
        ? {
            OR: [
              { customerEmail: { contains: search, mode: "insensitive" } },
              { customerName: { contains: search, mode: "insensitive" } },
              { orderNumber: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const [orders, totalCount] = await Promise.all([
      prisma.order.findMany({
        where,
        include: { orderLineItems: true, fulfillments: true },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.order.count({ where }),
    ]);

    const paginatedOrders = orders.map(transformOrder);
    const hasMore = (page - 1) * limit + paginatedOrders.length < totalCount;

    return NextResponse.json({
      orders: paginatedOrders,
      pagination: {
        page,
        limit,
        totalCount,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasMore
      }
    });

  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}
