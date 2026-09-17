import { cj } from "./client";
import type {
  CjProductDetail,
  CjProductListQuery,
  CjProductListResult,
  CjProductVariant,
} from "./types";

/**
 * Search/list the CJ catalog.
 * GET /product/listV2
 */
export function queryCjProducts(query: CjProductListQuery = {}) {
  return cj.get<CjProductListResult>("/product/listV2", {
    pageNum: query.page ?? 1,
    pageSize: query.size ?? 20,
    keyWord: query.keyWord,
    categoryId: query.categoryId,
    countryCode: query.countryCode,
    startSellPrice: query.startSellPrice,
    endSellPrice: query.endSellPrice,
  });
}

/**
 * Fetch full product detail (including variants) by CJ product id.
 * GET /product/query?pid=
 */
export function getCjProduct(pid: string) {
  return cj.get<CjProductDetail>("/product/query", { pid });
}

/**
 * Fetch only the variants for a product.
 * GET /product/variant/query?pid=
 */
export function getCjVariants(pid: string) {
  return cj.get<CjProductVariant[]>("/product/variant/query", { pid });
}
