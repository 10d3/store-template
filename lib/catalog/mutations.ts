"use server";
/**
 * lib/catalog/mutations.ts
 *
 * Server Actions for creating / updating / deleting products and variants.
 * All mutations revalidate CATALOG_TAG so caches auto-bust.
 *
 * These are "use server" — safe to import from Client Components via action props.
 */
import { headers } from "next/headers";
import { revalidateTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { CATALOG_TAG } from "./cache";
import type { ProductInput, VariantInput } from "./types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function requireAdmin() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user || session.user.role !== "admin") {
    throw new Error("Unauthorized");
  }
}

function bust() {
  // Next.js 16 revalidateTag requires a second argument for the cache scope
  revalidateTag(CATALOG_TAG, "everything");
}

// ─── Product mutations ────────────────────────────────────────────────────────

/**
 * Create a product (DB only — Stripe product should already exist).
 * The product ID is the Stripe product ID (prod_xxx).
 */
export async function createProduct(
  id: string,
  input: ProductInput
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdmin();
    await prisma.product.create({
      data: {
        id,
        name: input.name,
        slug: input.slug ?? null,
        description: input.description ?? null,
        subtitle: input.subtitle ?? null,
        tagline: input.tagline ?? null,
        images: input.images ?? [],
        category: input.category ?? null,
        type: input.type ?? null,
        gender: input.gender ?? null,
        collection: input.collection ?? null,
        collectionOrder: input.collectionOrder ?? null,
        featured: input.featured ?? false,
        tags: input.tags ?? [],
        isBundle: input.isBundle ?? false,
        nutrition: input.nutrition ?? null,
        metadata: input.metadata ?? {},
        variants:
          input.variants && input.variants.length > 0
            ? {
                create: input.variants.map((v, i) => ({
                  title: v.title ?? "Default",
                  position: v.position ?? i,
                  price: v.price,
                  compareAtPrice: v.compareAtPrice ?? null,
                  cost: v.cost ?? null,
                  stock: v.stock ?? 0,
                  trackInventory: v.trackInventory ?? false,
                  options: v.options ?? {},
                  sku: v.sku ?? null,
                  image: v.image ?? null,
                  cjVariantId: v.cjVariantId ?? null,
                  cjSku: v.cjSku ?? null,
                })),
              }
            : undefined,
      },
    });
    bust();
    return { success: true };
  } catch (err) {
    console.error("[catalog] createProduct error:", err);
    return { success: false, error: String(err) };
  }
}

/**
 * Update a product's metadata / display fields.
 */
export async function updateProduct(
  id: string,
  input: Partial<ProductInput>
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdmin();
    await prisma.product.update({
      where: { id },
      data: {
        ...(input.name !== undefined && { name: input.name }),
        ...(input.slug !== undefined && { slug: input.slug }),
        ...(input.description !== undefined && { description: input.description }),
        ...(input.subtitle !== undefined && { subtitle: input.subtitle }),
        ...(input.tagline !== undefined && { tagline: input.tagline }),
        ...(input.images !== undefined && { images: input.images }),
        ...(input.category !== undefined && { category: input.category }),
        ...(input.type !== undefined && { type: input.type }),
        ...(input.gender !== undefined && { gender: input.gender }),
        ...(input.collection !== undefined && { collection: input.collection }),
        ...(input.collectionOrder !== undefined && { collectionOrder: input.collectionOrder }),
        ...(input.featured !== undefined && { featured: input.featured }),
        ...(input.tags !== undefined && { tags: input.tags }),
        ...(input.isBundle !== undefined && { isBundle: input.isBundle }),
        ...(input.nutrition !== undefined && { nutrition: input.nutrition }),
        ...(input.metadata !== undefined && { metadata: input.metadata }),
        updatedAt: new Date(),
      },
    });
    bust();
    return { success: true };
  } catch (err) {
    console.error("[catalog] updateProduct error:", err);
    return { success: false, error: String(err) };
  }
}

/**
 * Soft-delete a product (sets active = false).
 */
export async function archiveProduct(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdmin();
    await prisma.product.update({
      where: { id },
      data: { active: false, updatedAt: new Date() },
    });
    bust();
    return { success: true };
  } catch (err) {
    console.error("[catalog] archiveProduct error:", err);
    return { success: false, error: String(err) };
  }
}

// ─── Variant mutations ────────────────────────────────────────────────────────

/**
 * Create a variant for an existing product.
 */
export async function createVariant(
  productId: string,
  input: VariantInput
): Promise<{ success: boolean; variantId?: string; error?: string }> {
  try {
    await requireAdmin();
    const variant = await prisma.productVariant.create({
      data: {
        productId,
        title: input.title ?? "Default",
        position: input.position ?? 0,
        price: input.price,
        compareAtPrice: input.compareAtPrice ?? null,
        cost: input.cost ?? null,
        stock: input.stock ?? 0,
        trackInventory: input.trackInventory ?? false,
        options: input.options ?? {},
        sku: input.sku ?? null,
        image: input.image ?? null,
        cjVariantId: input.cjVariantId ?? null,
        cjSku: input.cjSku ?? null,
      },
    });
    bust();
    return { success: true, variantId: variant.id };
  } catch (err) {
    console.error("[catalog] createVariant error:", err);
    return { success: false, error: String(err) };
  }
}

/**
 * Update an existing variant.
 */
export async function updateVariant(
  variantId: string,
  input: Partial<VariantInput>
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdmin();
    await prisma.productVariant.update({
      where: { id: variantId },
      data: {
        ...(input.title !== undefined && { title: input.title }),
        ...(input.position !== undefined && { position: input.position }),
        ...(input.price !== undefined && { price: input.price }),
        ...(input.compareAtPrice !== undefined && { compareAtPrice: input.compareAtPrice }),
        ...(input.cost !== undefined && { cost: input.cost }),
        ...(input.stock !== undefined && { stock: input.stock }),
        ...(input.trackInventory !== undefined && { trackInventory: input.trackInventory }),
        ...(input.options !== undefined && { options: input.options }),
        ...(input.sku !== undefined && { sku: input.sku }),
        ...(input.image !== undefined && { image: input.image }),
        ...(input.cjVariantId !== undefined && { cjVariantId: input.cjVariantId }),
        ...(input.cjSku !== undefined && { cjSku: input.cjSku }),
        updatedAt: new Date(),
      },
    });
    bust();
    return { success: true };
  } catch (err) {
    console.error("[catalog] updateVariant error:", err);
    return { success: false, error: String(err) };
  }
}

/**
 * Soft-delete a variant.
 */
export async function archiveVariant(
  variantId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdmin();
    await prisma.productVariant.update({
      where: { id: variantId },
      data: { active: false, updatedAt: new Date() },
    });
    bust();
    return { success: true };
  } catch (err) {
    console.error("[catalog] archiveVariant error:", err);
    return { success: false, error: String(err) };
  }
}

/**
 * Update the display order of variants for a product.
 * Pass an array of variantIds in the desired order (index = position).
 */
export async function reorderVariants(
  variantIds: string[]
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdmin();
    await prisma.$transaction(
      variantIds.map((id, index) =>
        prisma.productVariant.update({
          where: { id },
          data: { position: index },
        })
      )
    );
    bust();
    return { success: true };
  } catch (err) {
    console.error("[catalog] reorderVariants error:", err);
    return { success: false, error: String(err) };
  }
}

// ─── Bundle mutations ─────────────────────────────────────────────────────────

/**
 * Add a component product to a bundle.
 */
export async function addBundleItem(
  bundleProductId: string,
  opts: {
    componentProductId: string;
    componentVariantId?: string | null;
    quantity?: number;
    position?: number;
  }
): Promise<{ success: boolean; itemId?: string; error?: string }> {
  try {
    await requireAdmin();
    const item = await prisma.bundleItem.create({
      data: {
        bundleProductId,
        componentProductId: opts.componentProductId,
        componentVariantId: opts.componentVariantId ?? null,
        quantity: opts.quantity ?? 1,
        position: opts.position ?? 0,
      },
    });
    bust();
    return { success: true, itemId: item.id };
  } catch (err) {
    console.error("[catalog] addBundleItem error:", err);
    return { success: false, error: String(err) };
  }
}

/**
 * Remove a component from a bundle.
 */
export async function removeBundleItem(
  bundleItemId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdmin();
    await prisma.bundleItem.delete({ where: { id: bundleItemId } });
    bust();
    return { success: true };
  } catch (err) {
    console.error("[catalog] removeBundleItem error:", err);
    return { success: false, error: String(err) };
  }
}
