import { cj } from "./client";
import type { CjVariantStock } from "./types";

/**
 * Query inventory for a single variant by CJ variant id.
 * GET /product/stock/queryByVid?vid=
 */
export function getCjVariantStock(vid: string) {
  return cj.get<CjVariantStock>("/product/stock/queryByVid", { vid });
}
