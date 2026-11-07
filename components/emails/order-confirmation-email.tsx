import { formatMoney } from "@/lib/money";

export interface OrderEmailItem {
  productName: string;
  variantTitle: string;
  quantity: number;
  total: number;
}

export interface OrderEmailData {
  email: string;
  orderNumber: string;
  customerName?: string | null;
  items: OrderEmailItem[];
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  total: number;
  currency: string;
}

export function OrderConfirmationEmail({
  orderNumber,
  customerName,
  items,
  subtotal,
  discount,
  shipping,
  tax,
  total,
  currency,
}: OrderEmailData) {
  return (
    <div style={{ fontFamily: "Arial, sans-serif", lineHeight: 1.6, color: "#111", maxWidth: 600 }}>
      <h1 style={{ fontSize: 22 }}>Thanks{customerName ? `, ${customerName}` : ""} — order confirmed</h1>
      <p>
        Your order <strong>{orderNumber}</strong> is confirmed. We will email you again when it ships.
      </p>

      <table style={{ width: "100%", borderCollapse: "collapse", margin: "20px 0" }}>
        <tbody>
          {items.map((item, index) => (
            <tr key={`${item.productName}-${index}`}>
              <td style={{ padding: "8px 0", borderBottom: "1px solid #eee" }}>
                {item.productName}
                {item.variantTitle !== "Default" ? ` — ${item.variantTitle}` : ""}
                <br />
                <span style={{ color: "#666", fontSize: 13 }}>Qty {item.quantity}</span>
              </td>
              <td style={{ padding: "8px 0", borderBottom: "1px solid #eee", textAlign: "right" }}>
                {formatMoney(item.total, currency)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <table style={{ width: "100%", fontSize: 14 }}>
        <tbody>
          <tr>
            <td>Subtotal</td>
            <td style={{ textAlign: "right" }}>{formatMoney(subtotal, currency)}</td>
          </tr>
          {discount > 0 && (
            <tr>
              <td>Discount</td>
              <td style={{ textAlign: "right" }}>-{formatMoney(discount, currency)}</td>
            </tr>
          )}
          <tr>
            <td>Shipping</td>
            <td style={{ textAlign: "right" }}>
              {shipping > 0 ? formatMoney(shipping, currency) : "Free"}
            </td>
          </tr>
          {tax > 0 && (
            <tr>
              <td>Tax</td>
              <td style={{ textAlign: "right" }}>{formatMoney(tax, currency)}</td>
            </tr>
          )}
          <tr>
            <td style={{ fontWeight: 700, paddingTop: 8 }}>Total</td>
            <td style={{ textAlign: "right", fontWeight: 700, paddingTop: 8 }}>
              {formatMoney(total, currency)}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
