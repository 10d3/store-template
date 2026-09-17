import { cj } from "./client";
import type {
  CjCreateOrderPayload,
  CjCreateOrderResult,
  CjOrderDetail,
} from "./types";

/**
 * Create a fulfillment order in CJ.
 * POST /shopping/order/createOrderV2
 */
export function createCjOrder(payload: CjCreateOrderPayload) {
  return cj.post<CjCreateOrderResult>(
    "/shopping/order/createOrderV2",
    payload
  );
}

/**
 * Get order detail — includes status, trackNumber and logisticName.
 * GET /shopping/order/getOrderDetail?orderId=
 */
export function getCjOrderDetail(orderId: string) {
  return cj.get<CjOrderDetail>("/shopping/order/getOrderDetail", { orderId });
}

/**
 * Confirm (place) an order so CJ begins processing it.
 * PATCH /shopping/order/confirmOrder
 */
export function confirmCjOrder(orderId: string) {
  return cj.patch<{ orderId: string }>("/shopping/order/confirmOrder", {
    orderId,
  });
}

/**
 * Delete an order (only allowed while in CREATED / IN_CART status).
 * DELETE /shopping/order/deleteOrder?orderId=
 */
export function deleteCjOrder(orderId: string) {
  return cj.delete<{ orderId: string }>("/shopping/order/deleteOrder", {
    orderId,
  });
}
