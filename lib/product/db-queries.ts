"use server";

import { prisma } from "../prisma";
import type { StripeProduct } from "@/types/product";

/**
 * Transform database product to StripeProduct interface
 * Keeps compatibility with existing StripeProduct consumers
 */
function transformDbProduct(dbProduct: {
    id: string;
    name: string;
    description: string | null;
    images: string[];
    active: boolean;
    metadata: unknown;
    prices: {
        id: string;
        unitAmount: number;
        currency: string;
        isDefault: boolean;
    }[];
    nutrition?: { nutrition: string } | null;
}): StripeProduct {
    const baseMetadata =
        (dbProduct.metadata as Record<string, string>) ?? {};

    const metadata = {
        ...baseMetadata,
        ...(dbProduct.nutrition?.nutrition && {
            nutrition: dbProduct.nutrition.nutrition,
        }),
    };

    const defaultPrice =
        dbProduct.prices.find((p) => p.isDefault) ?? dbProduct.prices[0];

    return {
        id: dbProduct.id,
        name: dbProduct.name,
        description: dbProduct.description,
        images: dbProduct.images,
        active: dbProduct.active,
        metadata,
        default_price: defaultPrice
            ? {
                id: defaultPrice.id,
                unit_amount: defaultPrice.unitAmount,
                currency: defaultPrice.currency,
            }
            : null,
    };
}

/**
 * List all active products
 */
export async function listProductsFromDB(): Promise<StripeProduct[]> {
    const products = await prisma.product.findMany({
        where: { active: true },
        include: {
            prices: {
                where: { active: true },
                orderBy: { isDefault: "desc" },
                take: 1,
            },
            nutrition: true,
        },
        orderBy: { createdAt: "desc" },
    });

    return products.map(transformDbProduct);
}

/**
 * Get products by slug
 */
export async function getProductBySlugFromDB(
    slug: string
): Promise<StripeProduct[]> {
    const products = await prisma.product.findMany({
        where: {
            active: true,
            metadata: {
                path: ["slug"],
                equals: slug,
            },
        },
        include: {
            prices: {
                where: { active: true },
                orderBy: { isDefault: "desc" },
                take: 1,
            },
            nutrition: true,
        },
    });

    return products.map(transformDbProduct);
}

/**
 * Get products by IDs
 */
export async function getProductsByIdsFromDB(
    ids: string[]
): Promise<StripeProduct[]> {
    const products = await prisma.product.findMany({
        where: {
            id: { in: ids },
            active: true,
        },
        include: {
            prices: {
                where: { active: true },
                orderBy: { isDefault: "desc" },
                take: 1,
            },
            nutrition: true,
        },
    });

    return products.map(transformDbProduct);
}

/**
 * Get products by category or gender
 */
export async function getProductsByCategoryFromDB(
    category: string
): Promise<StripeProduct[]> {
    const products = await prisma.product.findMany({
        where: {
            active: true,
            OR: [
                {
                    metadata: {
                        path: ["category"],
                        string_contains: category,
                    },
                },
                {
                    metadata: {
                        path: ["gender"],
                        equals: category,
                    },
                },
            ],
        },
        include: {
            prices: {
                where: { active: true },
                orderBy: { isDefault: "desc" },
                take: 1,
            },
            nutrition: true,
        },
    });

    return products.map(transformDbProduct);
}

/**
 * Get bundle / pack products
 */
export async function getPacksFromDB(): Promise<StripeProduct[]> {
    const products = await prisma.product.findMany({
        where: {
            active: true,
            metadata: {
                path: ["type"],
                equals: "bundle",
            },
        },
        include: {
            prices: {
                where: { active: true },
                orderBy: { isDefault: "desc" },
                take: 1,
            },
            nutrition: true,
        },
        orderBy: { createdAt: "desc" },
    });

    return products.map(transformDbProduct);
}
