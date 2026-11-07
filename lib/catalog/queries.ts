/**
 * lib/catalog/queries.ts
 *
 * All Prisma read queries for the catalog.
 * Returns clean ProductWithVariants domain objects — no Stripe types leak out.
 *
 * Note: these are plain async functions (not "use server").
 * They are wrapped in unstable_cache inside lib/catalog/cache.ts.
 */
import { prisma } from "@/lib/prisma";
import type { ProductWithVariants, VariantData, BundleItemData } from "./types";

// ─── Shared Prisma selects ────────────────────────────────────────────────────

const variantSelect = {
  id: true,
  title: true,
  position: true,
  price: true,
  compareAtPrice: true,
  cost: true,
  stock: true,
  trackInventory: true,
  options: true,
  sku: true,
  image: true,
  stripePriceId: true,
  cjVariantId: true,
  cjSku: true,
  active: true,
} as const;

const bundleItemSelect = {
  id: true,
  quantity: true,
  position: true,
  componentProduct: {
    select: {
      id: true,
      name: true,
      slug: true,
      images: true,
    },
  },
  componentVariant: {
    select: {
      id: true,
      title: true,
      price: true,
      image: true,
    },
  },
} as const;

const productInclude = {
  variants: {
    where: { active: true },
    orderBy: { position: "asc" as const },
    select: variantSelect,
  },
  bundleItems: {
    orderBy: { position: "asc" as const },
    select: bundleItemSelect,
  },
};

// ─── Transformers ─────────────────────────────────────────────────────────────

function toVariantData(v: any): VariantData {
  return {
    id: v.id,
    title: v.title ?? "Default",
    position: v.position ?? 0,
    price: v.price ?? 0,
    compareAtPrice: v.compareAtPrice ?? null,
    cost: v.cost ?? null,
    stock: v.stock ?? 0,
    trackInventory: v.trackInventory ?? false,
    options: (v.options as Record<string, string>) ?? {},
    sku: v.sku ?? null,
    image: v.image ?? null,
    stripePriceId: v.stripePriceId ?? null,
    cjVariantId: v.cjVariantId ?? null,
    cjSku: v.cjSku ?? null,
    active: v.active ?? true,
  };
}

function toBundleItemData(bi: any): BundleItemData {
  return {
    id: bi.id,
    quantity: bi.quantity,
    position: bi.position,
    componentProduct: {
      id: bi.componentProduct.id,
      name: bi.componentProduct.name,
      slug: bi.componentProduct.slug,
      images: bi.componentProduct.images,
    },
    componentVariant: bi.componentVariant
      ? {
          id: bi.componentVariant.id,
          title: bi.componentVariant.title,
          price: bi.componentVariant.price,
          image: bi.componentVariant.image,
        }
      : null,
  };
}

export function toProductWithVariants(p: any): ProductWithVariants {
  const variants: VariantData[] = (p.variants ?? []).map(toVariantData);
  const prices = variants.map((v) => v.price).filter((price) => price > 0);

  return {
    id: p.id,
    slug: p.slug ?? null,
    name: p.name,
    description: p.description ?? null,
    subtitle: p.subtitle ?? null,
    tagline: p.tagline ?? null,
    images: p.images ?? [],
    active: p.active ?? true,
    category: p.category ?? null,
    type: p.type ?? null,
    gender: p.gender ?? null,
    collection: p.collection ?? null,
    collectionOrder: p.collectionOrder ?? null,
    featured: p.featured ?? false,
    tags: p.tags ?? [],
    source: p.source ?? "MANUAL",
    cjProductId: p.cjProductId ?? null,
    isBundle: p.isBundle ?? false,
    nutrition: p.nutrition ?? null,
    metadata: (p.metadata as Record<string, string>) ?? null,
    variants,
    bundleItems: (p.bundleItems ?? []).map(toBundleItemData),
    minPrice: prices.length > 0 ? Math.min(...prices) : 0,
    maxPrice: prices.length > 0 ? Math.max(...prices) : 0,
    defaultVariant: variants.find((v) => v.active) ?? null,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  };
}

// ─── Queries ──────────────────────────────────────────────────────────────────


/**
 * List all active products (non-bundle).
 */
export async function listActiveProducts(): Promise<ProductWithVariants[]> {
  const rows = await prisma.product.findMany({
    where: { active: true, isBundle: false },
    include: productInclude,
    orderBy: { createdAt: "desc" },
  });
  return rows.map(toProductWithVariants);
}

/**
 * List all active bundle products.
 */
export async function listBundles(): Promise<ProductWithVariants[]> {
  const rows = await prisma.product.findMany({
    where: { active: true, isBundle: true },
    include: productInclude,
    orderBy: { createdAt: "desc" },
  });
  return rows.map(toProductWithVariants);
}

/**
 * Get a single product by slug.
 */
export async function getProductBySlug(
  slug: string
): Promise<ProductWithVariants | null> {
  const row = await prisma.product.findFirst({
    where: { slug, active: true },
    include: productInclude,
  });
  return row ? toProductWithVariants(row) : null;
}

/**
 * Get multiple products by IDs.
 */
export async function getProductsByIds(
  ids: string[]
): Promise<ProductWithVariants[]> {
  if (ids.length === 0) return [];
  const rows = await prisma.product.findMany({
    where: { id: { in: ids }, active: true },
    include: productInclude,
  });
  // Preserve input ordering
  const map = new Map(rows.map((r) => [r.id, toProductWithVariants(r)]));
  return ids.map((id) => map.get(id)).filter((p): p is ProductWithVariants => !!p);
}

/**
 * Get featured products.
 */
export async function getFeaturedProducts(
  limit = 8
): Promise<ProductWithVariants[]> {
  const rows = await prisma.product.findMany({
    where: { active: true, featured: true, isBundle: false },
    include: productInclude,
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  return rows.map(toProductWithVariants);
}

/**
 * Get products in a collection (sorted by collectionOrder).
 */
export async function getProductsByCollection(
  collectionSlug: string
): Promise<ProductWithVariants[]> {
  const rows = await prisma.product.findMany({
    where: { active: true, collection: collectionSlug, isBundle: false },
    include: productInclude,
    orderBy: [{ collectionOrder: "asc" }, { createdAt: "desc" }],
  });
  return rows.map(toProductWithVariants);
}

/**
 * Get products by category or gender.
 */
export async function getProductsByCategory(
  category: string
): Promise<ProductWithVariants[]> {
  const rows = await prisma.product.findMany({
    where: {
      active: true,
      isBundle: false,
      OR: [{ category }, { gender: category }],
    },
    include: productInclude,
  });
  return rows.map(toProductWithVariants);
}

/**
 * Get related products for a given product.
 * Priority: explicit related_products metadata → same category fallback.
 */
export async function getRelatedProducts(
  productId: string,
  limit = 4
): Promise<ProductWithVariants[]> {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { metadata: true, category: true },
  });
  if (!product) return [];

  const meta = (product.metadata as Record<string, string>) ?? {};

  // 1. Explicit list from metadata
  if (meta.related_products) {
    const ids = meta.related_products
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .filter((id) => id !== productId);

    if (ids.length > 0) {
      const related = await getProductsByIds(ids);
      if (related.length > 0) return related.slice(0, limit);
    }
  }

  // 2. Same category fallback
  if (product.category) {
    const rows = await prisma.product.findMany({
      where: {
        active: true,
        isBundle: false,
        category: product.category,
        id: { not: productId },
      },
      include: productInclude,
      take: limit,
    });
    return rows.map(toProductWithVariants);
  }

  return [];
}

/**
 * Get all collection slugs with product counts.
 */
export async function getCollections(): Promise<
  { slug: string; productCount: number }[]
> {
  const rows = await prisma.product.groupBy({
    by: ["collection"],
    where: { active: true, collection: { not: null }, isBundle: false },
    _count: { _all: true },
  });
  return rows
    .filter((r) => r.collection)
    .map((r) => ({ slug: r.collection as string, productCount: r._count._all }));
}

/**
 * Get bundles that include a specific product.
 */
export async function getBundlesForProduct(
  productId: string
): Promise<ProductWithVariants[]> {
  const rows = await prisma.product.findMany({
    where: {
      active: true,
      isBundle: true,
      bundleItems: {
        some: { componentProductId: productId },
      },
    },
    include: productInclude,
  });
  return rows.map(toProductWithVariants);
}
