"use server";

import { prisma } from "../prisma";
import type { StripeProduct } from "@/types/product";

/**
 * Transform database product to StripeProduct interface
 * This keeps compatibility with existing code that expects StripeProduct
 */
function transformDbProduct(
    dbProduct: {
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
    },
    nutritionData?: { nutrition: string } | null
): StripeProduct {
    const metadata = (dbProduct.metadata as Record<string, string>) || {};

    // Add nutrition data to metadata if it exists
    if (nutritionData?.nutrition) {
        metadata.nutrition = nutritionData.nutrition;
    }

    // Find default price
    const defaultPrice = dbProduct.prices.find((p) => p.isDefault) || dbProduct.prices[0];

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
 * List all active products from the database
 * Returns products in StripeProduct format for compatibility
 */
export async function listProductsFromDB(): Promise<StripeProduct[]> {
    try {
        const products = await prisma.product.findMany({
            where: { active: true },
            include: {
                prices: {
                    where: { active: true },
                    orderBy: { isDefault: "desc" },
                },
            },
            orderBy: { createdAt: "desc" },
        });

        // Get nutrition data for all products
        const productIds = products.map((p) => p.id);
        const nutritionData = await prisma.productNutrition.findMany({
            where: { productId: { in: productIds } },
        });
        const nutritionMap = new Map(nutritionData.map((n) => [n.productId, n]));

        return products.map((product) =>
            transformDbProduct(product, nutritionMap.get(product.id))
        );
    } catch (error) {
        console.error("Error listing products from DB:", error);
        throw error;
    }
}

/**
 * Get a single product by slug from the database
 * Returns all variants matching the slug
 */
export async function getProductBySlugFromDB(
    slug: string
): Promise<StripeProduct[]> {
    try {
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
                },
            },
        });

        // Get nutrition data
        const productIds = products.map((p) => p.id);
        const nutritionData = await prisma.productNutrition.findMany({
            where: { productId: { in: productIds } },
        });
        const nutritionMap = new Map(nutritionData.map((n) => [n.productId, n]));

        return products.map((product) =>
            transformDbProduct(product, nutritionMap.get(product.id))
        );
    } catch (error) {
        console.error("Error getting product by slug from DB:", error);
        throw error;
    }
}

/**
 * Get products by their IDs from the database
 */
export async function getProductsByIdsFromDB(
    ids: string[]
): Promise<StripeProduct[]> {
    try {
        const products = await prisma.product.findMany({
            where: {
                id: { in: ids },
                active: true,
            },
            include: {
                prices: {
                    where: { active: true },
                    orderBy: { isDefault: "desc" },
                },
            },
        });

        // Get nutrition data
        const nutritionData = await prisma.productNutrition.findMany({
            where: { productId: { in: ids } },
        });
        const nutritionMap = new Map(nutritionData.map((n) => [n.productId, n]));

        return products.map((product) =>
            transformDbProduct(product, nutritionMap.get(product.id))
        );
    } catch (error) {
        console.error("Error getting products by IDs from DB:", error);
        throw error;
    }
}

/**
 * Get products by category from the database
 */
export async function getProductsByCategoryFromDB(
    category: string
): Promise<StripeProduct[]> {
    try {
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
                },
            },
        });

        const productIds = products.map((p) => p.id);
        const nutritionData = await prisma.productNutrition.findMany({
            where: { productId: { in: productIds } },
        });
        const nutritionMap = new Map(nutritionData.map((n) => [n.productId, n]));

        return products.map((product) =>
            transformDbProduct(product, nutritionMap.get(product.id))
        );
    } catch (error) {
        console.error("Error getting products by category from DB:", error);
        throw error;
    }
}

/**
 * Get all pack/bundle products from the database
 * Returns products where metadata.type === "bundle"
 */
export async function getPacksFromDB(): Promise<StripeProduct[]> {
    try {
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
                },
            },
            orderBy: { createdAt: "desc" },
        });

        return products.map((product) => transformDbProduct(product, null));
    } catch (error) {
        console.error("Error getting packs from DB:", error);
        throw error;
    }
}

