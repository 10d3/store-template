import { cache } from "react";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/lib/generated/prisma";

const productCardInclude = {
  images: { orderBy: { position: "asc" }, take: 1 },
  variants: {
    where: { active: true },
    orderBy: { position: "asc" },
    select: {
      id: true,
      title: true,
      price: true,
      compareAtPrice: true,
      stock: true,
      trackInventory: true,
      options: true,
      image: true,
      sku: true,
    },
  },
} satisfies Prisma.ProductInclude;

const productDetailInclude = {
  category: true,
  collections: { orderBy: { position: "asc" } },
  images: { orderBy: { position: "asc" } },
  variants: {
    where: { active: true },
    orderBy: { position: "asc" },
  },
  reviews: {
    where: { status: "APPROVED" },
    orderBy: { createdAt: "desc" },
    take: 20,
    include: { user: { select: { name: true } } },
  },
} satisfies Prisma.ProductInclude;

export type ProductCardData = Prisma.ProductGetPayload<{
  include: typeof productCardInclude;
}>;

export type ProductDetailData = Prisma.ProductGetPayload<{
  include: typeof productDetailInclude;
}>;

export async function getCategories() {
  return prisma.category.findMany({
    orderBy: [{ position: "asc" }, { name: "asc" }],
  });
}

export async function getCollections() {
  return prisma.collection.findMany({
    orderBy: [{ position: "asc" }, { name: "asc" }],
  });
}

export async function getCategoryBySlug(slug: string) {
  return prisma.category.findUnique({ where: { slug } });
}

export async function getCollectionBySlug(slug: string) {
  return prisma.collection.findUnique({ where: { slug } });
}

export async function getFeaturedProducts(limit = 8) {
  return prisma.product.findMany({
    where: { status: "ACTIVE", featured: true },
    include: productCardInclude,
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function listProducts({
  q,
  category,
  collection,
  sort = "newest",
  page = 1,
  pageSize = 12,
}: {
  q?: string;
  category?: string;
  collection?: string;
  sort?: string;
  page?: number;
  pageSize?: number;
}) {
  const where: Prisma.ProductWhereInput = { status: "ACTIVE" };

  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
    ];
  }
  if (category) where.category = { slug: category };
  if (collection) where.collections = { some: { slug: collection } };

  const orderBy: Prisma.ProductOrderByWithRelationInput =
    sort === "name"
      ? { name: "asc" }
      : sort === "oldest"
        ? { createdAt: "asc" }
        : { createdAt: "desc" };

  const safePage = Math.max(1, page);
  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: productCardInclude,
      orderBy,
      skip: (safePage - 1) * pageSize,
      take: pageSize,
    }),
    prisma.product.count({ where }),
  ]);

  return {
    products,
    total,
    page: safePage,
    pageCount: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export const getProductBySlug = cache(async (slug: string) => {
  return prisma.product.findFirst({
    where: { slug, status: "ACTIVE" },
    include: productDetailInclude,
  });
});

export async function getRelatedProducts(
  productId: string,
  categoryId: string | null,
  limit = 4
) {
  return prisma.product.findMany({
    where: {
      status: "ACTIVE",
      id: { not: productId },
      ...(categoryId ? { categoryId } : {}),
    },
    include: productCardInclude,
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function getSitemapProducts() {
  return prisma.product.findMany({
    where: { status: "ACTIVE" },
    select: { slug: true, updatedAt: true },
    orderBy: { updatedAt: "desc" },
  });
}
