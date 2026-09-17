"use server";

import Stripe from "stripe";
import { headers } from "next/headers";
import { prisma } from "../prisma";
import { auth } from "../auth";
import { getCjProduct, getCjVariants, queryCjProducts } from "./products";
import { getCjVariantStock } from "./inventory";
import { CjApiError } from "./errors";
import {
  syncProductToDatabase,
  syncPriceToDatabase,
} from "../product/product-sync";
import { markAsSynced } from "../subcription";
import { revalidateProductCache } from "../product/cache";
import type { CjProductListQuery, CjProductVariant } from "./types";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { typescript: true });

async function requireAdmin() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (session?.user?.role !== "admin") {
    throw new Error("Unauthorized");
  }
}

// Default selling-price multiplier applied to CJ supplier cost.
const DEFAULT_MARKUP = 3;

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .substring(0, 100);
}

/** CJ returns prices as USD dollars (number or "1.50"/"1.5--3.0" string). Returns cents. */
function dollarsToCents(value?: number | string | null): number {
  if (value == null) return 0;
  const first = typeof value === "string" ? value.split(/--|~|-/)[0] : value;
  const num = Number(first);
  return Number.isFinite(num) ? Math.round(num * 100) : 0;
}

/**
 * CJ `variantKey` is a hyphen-joined label like "Black-XXL" with no option names,
 * so we store it as a single display label. Phase 3 can refine into named options.
 */
function buildOptions(v: CjProductVariant): Record<string, string> {
  return v.variantKey ? { label: v.variantKey } : {};
}

export interface ImportCjOptions {
  /** Multiplier applied to supplier cost to set the selling price (default 3). */
  markup?: number;
  /** Per-variant override of the selling price, keyed by CJ vid, in cents. */
  manualPrices?: Record<string, number>;
  /** Enforce stock at checkout for this product (default true for CJ). */
  trackInventory?: boolean;
  /** Best-effort initial stock fetch per variant (default true; slow — 1 req/sec). */
  syncStock?: boolean;
}

export interface ImportCjResult {
  productId: string;
  slug: string;
  variants: number;
}

/**
 * Import a CJ Dropshipping product into the catalog:
 *  - creates a Stripe product mirror + one Stripe Price per variant,
 *  - upserts Product (source="CJ"), Price rows, and ProductVariant rows.
 *
 * Requires the Phase 1 migration (Product.cjProductId, ProductVariant).
 */
export async function importCjProduct(
  pid: string,
  opts: ImportCjOptions = {}
): Promise<ImportCjResult> {
  await requireAdmin();
  const markup = opts.markup ?? DEFAULT_MARKUP;
  const trackInventory = opts.trackInventory ?? true;
  const syncStock = opts.syncStock ?? true;

  // Guard against duplicate imports of the same CJ product.
  const existing = await prisma.product.findFirst({
    where: { cjProductId: pid },
    select: { id: true },
  });
  if (existing) {
    throw new CjApiError(
      `CJ product ${pid} is already imported (${existing.id}).`,
      "ALREADY_IMPORTED"
    );
  }

  // Failed imports can leave an orphaned Stripe mirror with no DB row
  // (cjProductId is only persisted after all Stripe objects exist).
  const priorMirrors = await stripe.products.search({
    query: `metadata['cjProductId']:'${pid}'`,
  });
  if (priorMirrors.data.length > 0) {
    throw new CjApiError(
      `CJ product ${pid} already has a Stripe mirror (${priorMirrors.data[0].id}) from a failed import. Resolve it before retrying.`,
      "ALREADY_IMPORTED"
    );
  }

  // 1. Fetch CJ product + variants.
  const detail = await getCjProduct(pid);
  let variants = detail.variants ?? [];
  if (variants.length === 0) variants = await getCjVariants(pid);
  if (variants.length === 0) {
    throw new CjApiError(`CJ product ${pid} has no variants.`, "NO_VARIANTS");
  }

  const slug = slugify(detail.productNameEn || pid);
  const images =
    detail.productImageSet && detail.productImageSet.length > 0
      ? detail.productImageSet
      : detail.bigImage
        ? [detail.bigImage]
        : [];

  // 2. Stripe product mirror — keep metadata minimal (DB is source of truth).
  const stripeProduct = await stripe.products.create({
    name: detail.productNameEn || "CJ Product",
    description: detail.description || undefined,
    images: images.slice(0, 8),
    metadata: { source: "cj", cjProductId: pid, slug, type: "product" },
  });
  markAsSynced(stripeProduct.id);

  // 3. One Stripe Price per variant.
  const created: {
    v: CjProductVariant;
    priceId: string;
    costCents: number;
    price: Stripe.Price;
  }[] = [];

  for (const v of variants) {
    const costCents = dollarsToCents(v.variantSellPrice);
    const sellCents =
      opts.manualPrices?.[v.vid] ?? Math.max(1, Math.round(costCents * markup));

    const price = await stripe.prices.create({
      product: stripeProduct.id,
      unit_amount: sellCents,
      currency: "usd",
      metadata: { cjVariantId: v.vid, variantKey: v.variantKey ?? "" },
    });
    markAsSynced(price.id);
    created.push({ v, priceId: price.id, costCents, price });
  }

  // 4. Set default price, then mirror product + prices into the DB.
  const defaultPriceId = created[0].priceId;
  const finalProduct = await stripe.products.update(stripeProduct.id, {
    default_price: defaultPriceId,
  });

  await syncProductToDatabase(finalProduct as Stripe.Product);
  await prisma.product.update({
    where: { id: stripeProduct.id },
    data: { source: "CJ", cjProductId: pid, trackInventory },
  });

  // 5. Sync prices + create variant rows (with best-effort stock).
  for (const c of created) {
    await syncPriceToDatabase(c.price, c.priceId === defaultPriceId);

    let stock = 0;
    if (syncStock) {
      try {
        const s = await getCjVariantStock(c.v.vid);
        stock =
          s.totalInventoryNum ??
          s.countryStockList?.reduce(
            (sum, r) => sum + (r.totalInventoryNum ?? 0),
            0
          ) ??
          0;
      } catch {
        // best-effort — Phase 6 inventory cron will fill this in.
      }
    }

    await prisma.productVariant.upsert({
      where: { stripePriceId: c.priceId },
      create: {
        productId: stripeProduct.id,
        stripePriceId: c.priceId,
        sku: c.v.variantSku ?? null,
        options: buildOptions(c.v),
        cjVariantId: c.v.vid,
        cjSku: c.v.variantSku ?? null,
        cost: c.costCents,
        stock,
        image: c.v.variantImage ?? null,
        active: true,
      },
      update: {
        cost: c.costCents,
        stock,
        image: c.v.variantImage ?? null,
        options: buildOptions(c.v),
        cjSku: c.v.variantSku ?? null,
      },
    });
  }

  await revalidateProductCache();
  return { productId: stripeProduct.id, slug, variants: created.length };
}

/** Search the CJ catalog (admin import UI). */
export async function searchCjCatalog(input: CjProductListQuery) {
  await requireAdmin();
  return await queryCjProducts({
    keyWord: input.keyWord,
    page: input.page ?? 1,
    size: input.size ?? 20,
    categoryId: input.categoryId,
    countryCode: input.countryCode,
  });
}

/** Fetch full CJ product detail for the import preview. */
export async function getCjProductPreview(pid: string) {
  await requireAdmin();
  return await getCjProduct(pid);
}
