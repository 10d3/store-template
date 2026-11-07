import { formatMoney } from "@/lib/money";

interface AddressShape {
  name?: string;
  line1?: string | null;
  line2?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  country?: string | null;
}

export interface OrderSummaryData {
  orderNumber: string;
  email: string;
  name: string | null;
  status: string;
  paymentStatus: string;
  fulfillmentStatus: string;
  currency: string;
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  total: number;
  createdAt: Date;
  trackingNumber?: string | null;
  trackingUrl?: string | null;
  carrier?: string | null;
  shippingAddress: unknown;
  items: {
    id: string;
    productName: string;
    variantTitle: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }[];
}

function addressLines(value: unknown) {
  const address = value as AddressShape | null;
  if (!address) return [];
  return [
    address.name,
    address.line1,
    address.line2,
    [address.city, address.state, address.postalCode].filter(Boolean).join(", "),
    address.country,
  ].filter(Boolean) as string[];
}

export function OrderSummary({ order }: { order: OrderSummaryData }) {
  const lines = addressLines(order.shippingAddress);

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
      <div className="space-y-8">
        <div className="rounded-xl border border-border/60 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm text-muted-foreground">Order</p>
              <p className="font-medium">{order.orderNumber}</p>
            </div>
            <div className="flex gap-2 text-xs">
              <span className="rounded-full bg-muted px-3 py-1">{order.status}</span>
              <span className="rounded-full bg-muted px-3 py-1">
                {order.fulfillmentStatus}
              </span>
            </div>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            Placed {order.createdAt.toLocaleDateString()} · {order.email}
          </p>
          {order.trackingNumber && (
            <p className="mt-3 text-sm">
              Tracking:{" "}
              {order.trackingUrl ? (
                <a href={order.trackingUrl} className="underline">
                  {order.trackingNumber}
                </a>
              ) : (
                order.trackingNumber
              )}
              {order.carrier ? ` (${order.carrier})` : ""}
            </p>
          )}
        </div>

        <div className="rounded-xl border border-border/60">
          <div className="border-b border-border/60 px-6 py-4">
            <h2 className="font-medium">Items</h2>
          </div>
          <div className="divide-y divide-border/60">
            {order.items.map((item) => (
              <div key={item.id} className="flex justify-between gap-4 px-6 py-4">
                <div>
                  <p className="text-sm font-medium">{item.productName}</p>
                  {item.variantTitle !== "Default" && (
                    <p className="text-sm text-muted-foreground">
                      {item.variantTitle}
                    </p>
                  )}
                  <p className="mt-1 text-sm text-muted-foreground">
                    Qty {item.quantity} × {formatMoney(item.unitPrice, order.currency)}
                  </p>
                </div>
                <p className="text-sm">{formatMoney(item.total, order.currency)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <aside className="space-y-6">
        <div className="rounded-xl border border-border/60 p-6">
          <h2 className="font-serif text-xl">Summary</h2>
          <div className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatMoney(order.subtotal, order.currency)}</span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Discount</span>
                <span>-{formatMoney(order.discount, order.currency)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Shipping</span>
              <span>
                {order.shipping > 0
                  ? formatMoney(order.shipping, order.currency)
                  : "Free"}
              </span>
            </div>
            {order.tax > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tax</span>
                <span>{formatMoney(order.tax, order.currency)}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-border/60 pt-3 text-base font-medium">
              <span>Total</span>
              <span>{formatMoney(order.total, order.currency)}</span>
            </div>
          </div>
        </div>

        {lines.length > 0 && (
          <div className="rounded-xl border border-border/60 p-6">
            <h2 className="font-medium">Shipping address</h2>
            <address className="mt-3 space-y-0.5 text-sm not-italic text-muted-foreground">
              {lines.map((line) => (
                <p key={line}>{line}</p>
              ))}
            </address>
          </div>
        )}
      </aside>
    </div>
  );
}
