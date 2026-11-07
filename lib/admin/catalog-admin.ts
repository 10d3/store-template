"use server";

/**
 * lib/admin/catalog-admin.ts
 *
 * Admin-scoped server actions for catalog data that the generic `lib/catalog`
 * service does not expose (all-products listing incl. bundles, archived
 * products, unarchive, and the legacy pack/bundle create/update flows).
 *
 * All product/variant/bundle mutations are DB-only and bust the catalog cache
 * via `revalidateTag(CATALOG_TAG, "everything")`. Price source of truth is
 * `ProductVariant.price` (cents).
 */
import { headers } from "next/headers";
import { revalidateTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import {
  CATALOG_TAG,
  toProductWithVariants,
  type BundleItemData,
  type ProductWithVariants,
  type VariantData,
} from "@/lib/catalog";
import type {
  ProductFormData,
  PackFormData,
} from "@/lib/product/product.schema";

const adminProductInclude = {
  variants: {
    where: { active: true },
    orderBy: { position: "asc" as const },
  },
  bundleItems: {
    orderBy: { position: "asc" as const },
    select: {
      id: true,
      quantity: true,
      position: true,
      componentProduct: {
        select: { id: true, name: true, slug: true, images: true },
      },
      componentVariant: {
        select: { id: true, title: true, price: true, image: true },
      },
    },
  },
};

async function requireAdmin() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user || session.user.role !== "admin") {
    throw new Error("Unauthorized");
  }
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .substring(0, 100);
}

function bustCatalog() {
  revalidateTag(CATALOG_TAG, "everything");
}

/**
 * All active products, including bundles. Legacy `listProducts` returned every
 * active Stripe product; catalog's `listActiveProducts` excludes bundles, so
 * the admin needs this broader read.
 */
export async function listProducts(): Promise<ProductWithVariants[]> {
  const products = await prisma.product.findMany({
    where: { active: true },
    include: adminProductInclude,
    orderBy: { createdAt: "desc" },
  });
  return products.map((p) => toProductWithVariants(p));
}

/** A single product in the catalog shape, or null when it does not exist. */
export async function getProductById(
  id: string
): Promise<ProductWithVariants | null> {
  const product = await prisma.product.findUnique({
    where: { id },
    include: adminProductInclude,
  });
  return product ? toProductWithVariants(product) : null;
}

/** Archived (inactive) products in the catalog shape. */
export async function getArchivedProducts(): Promise<ProductWithVariants[]> {
  await requireAdmin();
  const products = await prisma.product.findMany({
    where: { active: false },
    include: adminProductInclude,
    orderBy: { createdAt: "desc" },
  });
  return products.map((p) => toProductWithVariants(p));
}

/** Reactivate an archived product. */
export async function unarchiveProduct(
  id: string
): Promise<{ success: boolean }> {
  await requireAdmin();
  await prisma.product.update({ where: { id }, data: { active: true } });
  bustCatalog();
  return { success: true };
}

export async function archiveProduct(
  id: string
): Promise<{ success: boolean }> {
  await requireAdmin();
  await prisma.product.update({ where: { id }, data: { active: false } });
  bustCatalog();
  return { success: true };
}

/** Create a product (DB-only). A default variant carries the form price. */
export async function createProduct(
  data: ProductFormData
): Promise<ProductWithVariants> {
  await requireAdmin();
  const id = crypto.randomUUID();
  const metadata = { ...(data.metadata ?? {}) };
  const nutrition =
    typeof metadata.nutrition === "string" ? metadata.nutrition : undefined;
  delete metadata.nutrition;
  const slug = metadata.slug || generateSlug(data.name);
  // Prefer the explicit form flag; fall back to a legacy metadata marker only
  // for records created before the `isBundle` column existed.
  const isBundle = data.isBundle ?? metadata.type === "bundle";
  delete metadata.type;

  const variantInputs = data.variants?.length
    ? data.variants.map((v, i) => ({
        title: v.name || "Default",
        position: v.position ?? i,
        price: Math.round(v.price),
        compareAtPrice:
          v.compareAtPrice && v.compareAtPrice > 0
            ? Math.round(v.compareAtPrice)
            : null,
        stock: v.stock ?? 0,
        sku: v.sku ?? null,
        active: v.active ?? true,
        options: v.metadata ?? {},
        image: v.images?.[0] ?? null,
      }))
    : [
        {
          title: "Default",
          position: 0,
          price: Math.round(data.price),
          compareAtPrice: null,
          stock: 0,
          sku: null,
          active: true,
          options: {},
          image: data.images?.[0] ?? null,
        },
      ];

  const created = await prisma.product.create({
    data: {
      id,
      name: data.name,
      slug,
      description: data.description ?? null,
      images: data.images ?? [],
      metadata,
      nutrition: nutrition ?? null,
      isBundle,
      variants: { create: variantInputs },
    },
    include: adminProductInclude,
  });
  bustCatalog();
  return toProductWithVariants(created);
}

/** Update a product (DB-only). Variants are upserted by id when supplied. */
export async function updateProduct(
  id: string,
  data: Partial<ProductFormData>
): Promise<ProductWithVariants> {
  await requireAdmin();
  const metadata = data.metadata ? { ...data.metadata } : undefined;
  let nutrition: string | undefined;
  let isBundle: boolean | undefined;
  if (metadata) {
    nutrition =
      typeof metadata.nutrition === "string" ? metadata.nutrition : undefined;
    isBundle =
      data.isBundle ??
      (typeof metadata.type === "string" ? metadata.type === "bundle" : undefined);
    delete metadata.nutrition;
    delete metadata.type;
  } else if (data.isBundle !== undefined) {
    isBundle = data.isBundle;
  }

  await prisma.product.update({
    where: { id },
    data: {
      name: data.name,
      description: data.description,
      images: data.images,
      slug: metadata?.slug,
      metadata,
      nutrition: metadata ? (nutrition ?? null) : undefined,
      isBundle,
    },
  });

  if (data.variants) {
    for (const [i, v] of data.variants.entries()) {
      const variantData = {
        title: v.name || "Default",
        position: v.position ?? i,
        price: Math.round(v.price),
        compareAtPrice:
          v.compareAtPrice && v.compareAtPrice > 0
            ? Math.round(v.compareAtPrice)
            : null,
        stock: v.stock ?? 0,
        sku: v.sku ?? null,
        active: v.active ?? true,
        options: v.metadata ?? {},
        image: v.images?.[0] ?? null,
      };
      if (v.id) {
        await prisma.productVariant.update({
          where: { id: v.id },
          data: variantData,
        });
      } else {
        await prisma.productVariant.create({
          data: { productId: id, ...variantData },
        });
      }
    }
  } else if (data.price !== undefined) {
    const first = await prisma.productVariant.findFirst({
      where: { productId: id },
      orderBy: { position: "asc" },
    });
    if (first) {
      await prisma.productVariant.update({
        where: { id: first.id },
        data: { price: Math.round(data.price) },
      });
    }
  }

  const updated = await prisma.product.findUniqueOrThrow({
    where: { id },
    include: adminProductInclude,
  });
  bustCatalog();
  return toProductWithVariants(updated);
}

/**
 * Create a bundle product (DB-only). Bundle membership is stored as
 * `BundleItem` rows (the single source of truth). Pack-size/price
 * configuration (`pack_sizes`, `discount`, `pack_type`) has no DB column and
 * legitimately remains in metadata; composition (`contents`) does not.
 */
export async function createPack(data: PackFormData): Promise<ProductWithVariants> {
  await requireAdmin();
  const id = crypto.randomUUID();
  const slug = generateSlug(data.name);
  const packMetadata: Record<string, unknown> = {
    slug,
    discount: data.discount?.toString() || "0",
  };
  if (data.packType) packMetadata.pack_type = data.packType;
  if (data.packSizes) {
    packMetadata.pack_sizes = JSON.stringify(
      data.packSizes.map(({ image, ...rest }) => rest)
    );
  }
  const metadata = { ...packMetadata, ...(data.metadata ?? {}) };
  delete metadata.contents;
  delete metadata.type;

  const created = await prisma.product.create({
    data: {
      id,
      name: data.name,
      slug,
      description: data.description ?? null,
      images: data.images ?? [],
      isBundle: true,
      metadata,
      variants: {
        create: [
          {
            title: "Default",
            position: 0,
            price: Math.round(data.packPrice),
            options: {},
            image: data.images?.[0] ?? null,
          },
        ],
      },
      bundleItems: {
        create: data.productIds.map((componentProductId, i) => ({
          componentProductId,
          quantity: 1,
          position: i,
        })),
      },
    },
    include: adminProductInclude,
  });
  bustCatalog();
  return toProductWithVariants(created);
}

/** Update a bundle product and replace its BundleItem membership. */
export async function updatePack(
  id: string,
  data: PackFormData
): Promise<ProductWithVariants> {
  await requireAdmin();
  const slug = data.metadata?.slug || generateSlug(data.name);
  const packMetadata: Record<string, unknown> = {
    slug,
    discount: data.discount?.toString() || "0",
    bundle_type: data.metadata?.bundle_type || "",
    category: data.metadata?.category || "",
  };
  if (data.packType) packMetadata.pack_type = data.packType;
  if (data.packSizes) {
    packMetadata.pack_sizes = JSON.stringify(
      data.packSizes.map(({ image, ...rest }) => rest)
    );
  }
  const metadata = { ...packMetadata, ...(data.metadata ?? {}) };
  delete metadata.contents;
  delete metadata.type;

  await prisma.product.update({
    where: { id },
    data: {
      name: data.name,
      slug,
      description: data.description,
      images: data.images,
      isBundle: true,
      metadata,
    },
  });

  const first = await prisma.productVariant.findFirst({
    where: { productId: id },
    orderBy: { position: "asc" },
  });
  if (first) {
    await prisma.productVariant.update({
      where: { id: first.id },
      data: { price: Math.round(data.packPrice) },
    });
  } else {
    await prisma.productVariant.create({
      data: {
        productId: id,
        title: "Default",
        position: 0,
        price: Math.round(data.packPrice),
        options: {},
      },
    });
  }

  await prisma.bundleItem.deleteMany({ where: { bundleProductId: id } });
  if (data.productIds.length) {
    await prisma.bundleItem.createMany({
      data: data.productIds.map((componentProductId, i) => ({
        bundleProductId: id,
        componentProductId,
        quantity: 1,
        position: i,
      })),
    });
  }

  const updated = await prisma.product.findUniqueOrThrow({
    where: { id },
    include: adminProductInclude,
  });
  bustCatalog();
  return toProductWithVariants(updated);
}

/**
 * Variants for a product in the catalog `VariantData` shape used by the admin
 * variants dialog. DB-only (no Stripe price creation).
 */
export async function listProductVariants(
  productId: string
): Promise<VariantData[]> {
  await requireAdmin();
  const variants = await prisma.productVariant.findMany({
    where: { productId },
    orderBy: { createdAt: "asc" },
  });

  return variants.map((v) => ({
    id: v.id,
    title: v.title ?? "Default",
    position: v.position ?? 0,
    price: v.price,
    compareAtPrice: v.compareAtPrice ?? null,
    cost: v.cost,
    stock: v.stock,
    trackInventory: v.trackInventory,
    options: (v.options as Record<string, string>) ?? {},
    sku: v.sku,
    image: v.image,
    stripePriceId: v.stripePriceId,
    cjVariantId: v.cjVariantId,
    cjSku: v.cjSku,
    active: v.active,
  }));
}

/**
 * Bundle components for a bundle product in the catalog `BundleItemData` shape.
 * Used by the admin BundleComponentPicker (edit mode).
 */
export async function getBundleItems(
  bundleProductId: string
): Promise<BundleItemData[]> {
  await requireAdmin();
  const items = await prisma.bundleItem.findMany({
    where: { bundleProductId },
    orderBy: { position: "asc" },
    select: {
      id: true,
      quantity: true,
      position: true,
      componentProduct: {
        select: { id: true, name: true, slug: true, images: true },
      },
      componentVariant: {
        select: { id: true, title: true, price: true, image: true },
      },
    },
  });
  return items;
}

/**
 * Update a bundle item's quantity and/or position. DB-only; busts catalog.
 */
export async function updateBundleItem(
  bundleItemId: string,
  data: { quantity?: number; position?: number }
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdmin();
    await prisma.bundleItem.update({
      where: { id: bundleItemId },
      data: {
        ...(data.quantity !== undefined
          ? { quantity: Math.max(1, Math.round(data.quantity)) }
          : {}),
        ...(data.position !== undefined ? { position: data.position } : {}),
      },
    });
    bustCatalog();
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update item",
    };
  }
}

/**
 * Reorder a bundle's components given an ordered list of bundle item ids.
 * DB-only; busts catalog.
 */
export async function reorderBundleItems(
  bundleProductId: string,
  orderedIds: string[]
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdmin();
    await prisma.$transaction(
      orderedIds.map((id, index) =>
        prisma.bundleItem.updateMany({
          where: { id, bundleProductId },
          data: { position: index },
        })
      )
    );
    bustCatalog();
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to reorder items",
    };
  }
}
