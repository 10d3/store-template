"use server";

import Stripe from "stripe";
import { prisma } from "../prisma";
import { syncPriceToDatabase } from "./product-sync";
import { markAsSynced } from "../subcription";
import { revalidateProductCache } from "./cache";
import type { ProductVariantData } from "@/types/product";
import { headers } from "next/headers";
import { auth } from "../auth";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { typescript: true });

async function requireAdmin() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user || session.user.role !== "admin") {
    throw new Error("Unauthorized");
  }
}

export interface VariantInput {
  options: Record<string, string>;
  priceCents: number;
  sku?: string;
  stock?: number;
  image?: string;
}

/** List all variants for a product (with resolved price). */
export async function listProductVariants(
  productId: string
): Promise<ProductVariantData[]> {
  const variants = await prisma.productVariant.findMany({
    where: { productId },
    orderBy: { createdAt: "asc" },
  });

  const priceIds = variants
    .map((v) => v.stripePriceId)
    .filter((id): id is string => !!id);
  const prices = await prisma.price.findMany({
    where: { id: { in: priceIds } },
    select: { id: true, unitAmount: true, currency: true },
  });
  const priceMap = new Map(prices.map((p) => [p.id, p]));

  return variants.map((v) => {
    const linked = v.stripePriceId ? priceMap.get(v.stripePriceId) : undefined;
    return {
      id: v.id,
      stripePriceId: v.stripePriceId,
      sku: v.sku,
      options: (v.options as Record<string, string>) ?? {},
      stock: v.stock,
      cost: v.cost,
      image: v.image,
      active: v.active,
      unit_amount: linked?.unitAmount ?? null,
      currency: linked?.currency ?? "usd",
    };
  });
}

function priceMetadata(options: Record<string, string>, sku?: string) {
  const meta: Record<string, string> = { ...options };
  if (sku) meta.sku = sku;
  return meta;
}

/** Create a manual variant: a new Stripe Price + ProductVariant row. */
export async function createProductVariant(
  productId: string,
  input: VariantInput
): Promise<string> {
  await requireAdmin();
  const price = await stripe.prices.create({
    product: productId,
    unit_amount: input.priceCents,
    currency: "usd",
    metadata: priceMetadata(input.options, input.sku),
  });
  markAsSynced(price.id);
  await syncPriceToDatabase(price, false);

  const variant = await prisma.productVariant.create({
    data: {
      productId,
      stripePriceId: price.id,
      options: input.options,
      sku: input.sku ?? null,
      stock: input.stock ?? 0,
      image: input.image ?? null,
      active: true,
    },
  });

  await revalidateProductCache();
  return variant.id;
}

export interface VariantUpdate {
  options?: Record<string, string>;
  sku?: string | null;
  stock?: number;
  image?: string | null;
  active?: boolean;
  priceCents?: number;
}

/** Update a variant. A price change creates a new Stripe Price and retires the old. */
export async function updateProductVariant(
  variantId: string,
  input: VariantUpdate
): Promise<void> {
  await requireAdmin();
  const existing = await prisma.productVariant.findUnique({
    where: { id: variantId },
  });
  if (!existing) throw new Error("Variant not found");

  let stripePriceId = existing.stripePriceId;

  if (input.priceCents != null) {
    const newPrice = await stripe.prices.create({
      product: existing.productId,
      unit_amount: input.priceCents,
      currency: "usd",
      metadata: priceMetadata(
        input.options ?? (existing.options as Record<string, string>) ?? {},
        input.sku ?? existing.sku ?? undefined
      ),
    });
    markAsSynced(newPrice.id);
    await syncPriceToDatabase(newPrice, false);
    if (existing.stripePriceId) {
      try {
        await stripe.prices.update(existing.stripePriceId, { active: false });
      } catch {
        // ignore — best effort
      }
    }
    stripePriceId = newPrice.id;
  }

  await prisma.productVariant.update({
    where: { id: variantId },
    data: {
      ...(input.options !== undefined && { options: input.options }),
      ...(input.sku !== undefined && { sku: input.sku }),
      ...(input.stock !== undefined && { stock: input.stock }),
      ...(input.image !== undefined && { image: input.image }),
      ...(input.active !== undefined && { active: input.active }),
      ...(stripePriceId !== existing.stripePriceId && { stripePriceId }),
    },
  });

  await revalidateProductCache();
}

/** Soft-delete a variant (deactivate its Stripe price + mark inactive). */
export async function deleteProductVariant(variantId: string): Promise<void> {
  await requireAdmin();
  const v = await prisma.productVariant.findUnique({ where: { id: variantId } });
  if (!v) return;
  if (v.stripePriceId) {
    try {
      await stripe.prices.update(v.stripePriceId, { active: false });
    } catch {
      // ignore — best effort
    }
  }
  await prisma.productVariant.update({
    where: { id: variantId },
    data: { active: false },
  });
  await revalidateProductCache();
}

/** Toggle inventory tracking + the storefront variant selector for a product. */
export async function setProductTrackInventory(
  productId: string,
  enabled: boolean
): Promise<void> {
  await requireAdmin();
  await prisma.product.update({
    where: { id: productId },
    data: { trackInventory: enabled },
  });
  await revalidateProductCache();
}
