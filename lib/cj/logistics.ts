import { cj } from "./client";
import type { CjFreightOption, CjFreightQuery } from "./types";

/**
 * Estimate shipping options/cost for a set of variants to a destination.
 * POST /logistic/freightCalculate
 */
export function freightCalculate(query: CjFreightQuery) {
  return cj.post<CjFreightOption[]>("/logistic/freightCalculate", query);
}
