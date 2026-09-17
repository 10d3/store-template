/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Standard CJ API v2 response envelope.
 * `result === true` (and `code === 200`) indicates success.
 * See: https://developers.cjdropshipping.cn/en/api/api2/standard/definition.html
 */
export interface CjEnvelope<T> {
  code: number;
  result: boolean;
  message: string;
  data: T;
  requestId: string;
}

// ── Authentication ────────────────────────────────────────────────
// POST /authentication/getAccessToken  body { apiKey }
// POST /authentication/refreshAccessToken  body { refreshToken }
export interface CjAccessToken {
  openId?: number;
  accessToken: string;
  accessTokenExpiryDate: string; // e.g. "2025-01-01T00:00:00+08:00"
  refreshToken: string;
  refreshTokenExpiryDate: string;
  createDate?: string;
}

// ── Products ──────────────────────────────────────────────────────
// GET /product/listV2
export interface CjProductListItem {
  id: string; // CJ product id (pid)
  nameEn: string;
  sku?: string;
  spu?: string;
  bigImage?: string;
  sellPrice?: string; // CJ returns prices as strings / ranges (e.g. "1.50" or "1.50--3.00")
  nowPrice?: string;
  oneCategoryName?: string;
  twoCategoryName?: string;
  threeCategoryName?: string;
  warehouseInventoryNum?: number;
}

export interface CjProductListResult {
  pageNum: number;
  pageSize: number;
  total: number;
  list: CjProductListItem[];
}

export interface CjProductListQuery {
  page?: number;
  size?: number;
  keyWord?: string;
  categoryId?: string;
  countryCode?: string;
  startSellPrice?: number;
  endSellPrice?: number;
}

// GET /product/query  (?pid | ?productSku | ?variantSku)
export interface CjProductVariant {
  vid: string; // CJ variant id
  pid?: string;
  variantNameEn?: string;
  variantSku?: string;
  variantKey?: string; // e.g. "Black-XXL"
  variantImage?: string;
  variantSellPrice?: number;
  variantWeight?: number;
}

export interface CjProductDetail {
  pid: string;
  productNameEn: string;
  productSku?: string;
  bigImage?: string;
  productImageSet?: string[];
  description?: string;
  sellPrice?: string;
  categoryName?: string;
  variants?: CjProductVariant[];
}

// ── Inventory ─────────────────────────────────────────────────────
// GET /product/stock/queryByVid?vid=
export interface CjVariantStockArea {
  areaEn?: string;
  countryCode?: string;
  totalInventoryNum?: number;
  cjInventoryNum?: number;
  factoryInventoryNum?: number;
}

export interface CjVariantStock {
  vid: string;
  // CJ returns an array of warehouse/area inventory rows
  countryStockList?: CjVariantStockArea[];
  totalInventoryNum?: number;
}

// ── Orders (shopping) ─────────────────────────────────────────────
// POST /shopping/order/createOrderV2
export interface CjCreateOrderProduct {
  vid: string;
  quantity: number;
  sku?: string;
}

export interface CjCreateOrderPayload {
  orderNumber: string; // our unique order id
  shippingCountryCode: string;
  shippingCountry?: string;
  shippingProvince: string;
  shippingCity: string;
  shippingAddress: string;
  shippingCustomerName: string;
  shippingPhone?: string;
  shippingZip?: string;
  logisticName: string;
  fromCountryCode: string;
  remark?: string;
  products: CjCreateOrderProduct[];
}

export interface CjCreateOrderResult {
  orderId: string;
  orderNumber?: string;
  shipmentOrderId?: string;
  orderStatus?: string;
  productAmount?: number;
  postageAmount?: number;
  actualPayment?: number;
  cjPayUrl?: string;
}

// GET /shopping/order/getOrderDetail?orderId=
export type CjOrderStatus =
  | "CREATED"
  | "IN_CART"
  | "UNPAID"
  | "UNSHIPPED"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED"
  | string;

export interface CjOrderDetailProduct {
  vid: string;
  quantity: number;
  sellPrice?: number;
}

export interface CjOrderDetail {
  orderId: string;
  orderNum?: string;
  orderStatus?: CjOrderStatus;
  trackNumber?: string;
  logisticName?: string;
  productAmount?: number;
  postageAmount?: number;
  orderAmount?: number;
  productList?: CjOrderDetailProduct[];
}

// ── Logistics ─────────────────────────────────────────────────────
// POST /logistic/freightCalculate
export interface CjFreightQuery {
  startCountryCode: string;
  endCountryCode: string;
  zip?: string;
  products: { vid: string; quantity: number }[];
}

export interface CjFreightOption {
  logisticName: string;
  logisticPrice?: number;
  logisticPriceCn?: number;
  logisticAging?: string;
  totalPostageFee?: number;
}
