/**
 * Shared order-display types for the customer orders pages. The server maps
 * both `OrderLineItem` records and the legacy `Order.lineItems` JSON mirror
 * into `DisplayOrderItem` before handing data to the client components.
 */
export interface DisplayOrderItem {
  id: string;
  productName: string;
  variantTitle?: string;
  image?: string;
  /** Unit price in cents. */
  unitPrice: number;
  quantity: number;
  /** Line total in cents. */
  totalPrice: number;
}

/** Minimal order projection handed from the server pages to the clients. */
export interface CustomerOrder {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  createdAt: Date | string;
  shippingAddress: string | null;
  customerEmail: string | null;
  userId: string | null;
  lineItems: DisplayOrderItem[];
}

/** Result of the public order lookup (ownership + email gating). */
export interface PublicOrderResult {
  order: CustomerOrder | null;
  requiresAuth: boolean;
  emailRequired?: boolean;
}
