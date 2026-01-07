"use server";

import { cache } from "react";
import type { Prisma } from "../generated/prisma";
import { prisma } from "../prisma";
import type { StripeProduct } from "@/types/product";

/**
 * Transform a DB product to StripeProduct format
 */
function transformDbProduct(dbProduct: {
    id: string;
    name: string;
    description: string | null;
    images: string[];
    active: boolean;
    slug?: string | null;
    category?: string | null;
    gender?: string | null;
    type?: string | null;
    metadata?: Prisma.JsonValue | null;
    prices: {
        id: string;
        unitAmount: number;
        currency: string;
        isDefault: boolean;
    }[];
    nutrition?: {
        nutrition: string;
    } | null;
}): StripeProduct {
    // Safely cast metadata to object
    const metadata: Record<string, any> =
        typeof dbProduct.metadata === "object" && dbProduct.metadata !== null
            ? (dbProduct.metadata as Record<string, any>)
            : {};

    // Add nutrition if exists
    if (dbProduct.nutrition?.nutrition) {
        metadata.nutrition = dbProduct.nutrition.nutrition;
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
 * List all active products in StripeProduct format (fast, single query)
 */
export async function listProductsFromDB(): Promise<StripeProduct[]> {
    try {
        const products = await prisma.product.findMany({
            where: { active: true },
            include: {
                prices: {
                    where: { active: true },
                    orderBy: { isDefault: "desc" },
                    take: 1, // Only fetch default price
                },
                nutrition: true, // Include nutrition in same query
            },
            orderBy: { createdAt: "desc" },
        });

        return products.map(transformDbProduct);
    } catch (error) {
        console.error("Error listing products from DB:", error);
        throw error;
    }
}


export const listProductsFromDBCached = cache(listProductsFromDB);