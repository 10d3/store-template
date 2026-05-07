"use server";

import Stripe from "stripe";
import { prisma } from "../prisma";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    typescript: true,
});

/**
 * Sync a Stripe product to the database
 * Called when product.created or product.updated webhook fires
 */
export async function syncProductToDatabase(product: Stripe.Product) {
    try {
        const metadata = product.metadata as Record<string, string>;


        // Get the default price if it exists
        let defaultPrice: Stripe.Price | null = null;
        if (product.default_price) {
            if (typeof product.default_price === "string") {
                defaultPrice = await stripe.prices.retrieve(product.default_price);
            } else {
                defaultPrice = product.default_price;
            }
        }

        // Upsert the product - extract commonly queried fields from metadata for indexed columns
        await prisma.product.upsert({
            where: { id: product.id },
            update: {
                name: product.name,
                description: product.description || null,
                images: product.images || [],
                active: product.active,
                metadata: product.metadata as object,
                // Populate indexed columns from metadata for fast queries
                type: metadata.type || null,
                slug: metadata.slug || null,
                category: metadata.category || null,
                gender: metadata.gender || null,
                updatedAt: new Date(),
            },
            create: {
                id: product.id,
                name: product.name,
                description: product.description || null,
                images: product.images || [],
                active: product.active,
                metadata: product.metadata as object,
                type: metadata.type || null,
                slug: metadata.slug || null,
                category: metadata.category || null,
                gender: metadata.gender || null,
            },
        });

        // Sync the default price if exists
        if (defaultPrice) {
            await syncPriceToDatabase(defaultPrice, true);
        }


        return { success: true };
    } catch (error) {
        console.error(`❌ Error syncing product ${product.id}:`, error);
        return { success: false, error };
    }
}

/**
 * Soft delete a product from the database (set active = false)
 * Called when product.deleted webhook fires
 */
export async function deleteProductFromDatabase(productId: string) {
    try {


        await prisma.product.update({
            where: { id: productId },
            data: {
                active: false,
                updatedAt: new Date(),
            },
        });

        // Also deactivate all prices for this product
        await prisma.price.updateMany({
            where: { productId },
            data: {
                active: false,
                updatedAt: new Date(),
            },
        });


        return { success: true };
    } catch (error) {
        console.error(`❌ Error deleting product ${productId}:`, error);
        return { success: false, error };
    }
}

/**
 * Sync a Stripe price to the database
 * Called when price.created or price.updated webhook fires
 */
export async function syncPriceToDatabase(
    price: Stripe.Price,
    isDefault: boolean = false
) {
    try {
        const productId =
            typeof price.product === "string" ? price.product : price.product.id;



        // If this is the default price, unset other defaults first
        if (isDefault) {
            await prisma.price.updateMany({
                where: { productId, isDefault: true },
                data: { isDefault: false },
            });
        }

        await prisma.price.upsert({
            where: { id: price.id },
            update: {
                unitAmount: price.unit_amount || 0,
                currency: price.currency,
                active: price.active,
                isDefault,
                // Don't update image from Stripe metadata - images stored directly in DB
                // (Stripe metadata has 500 char limit)
                metadata: price.metadata ?? {},
                updatedAt: new Date(),
            },
            create: {
                id: price.id,
                productId,
                unitAmount: price.unit_amount || 0,
                currency: price.currency,
                active: price.active,
                isDefault,
                image: price.metadata?.image || null,
                metadata: price.metadata ?? {},
            },
        });


        return { success: true };
    } catch (error) {
        console.error(`❌ Error syncing price ${price.id}:`, error);
        return { success: false, error };
    }
}

/**
 * Delete a price from the database
 * Called when price.deleted webhook fires
 */
export async function deletePriceFromDatabase(priceId: string) {
    try {


        await prisma.price.update({
            where: { id: priceId },
            data: {
                active: false,
                updatedAt: new Date(),
            },
        });


        return { success: true };
    } catch (error) {
        console.error(`❌ Error deleting price ${priceId}:`, error);
        return { success: false, error };
    }
}

/**
 * Sync all Stripe products to the database
 * Run this as a one-time migration script or manual resync
 */
export async function syncAllProducts() {
    try {


        // Fetch all active products from Stripe
        const products = await stripe.products.list({
            active: true,
            limit: 100,
            expand: ["data.default_price"],
        });



        let synced = 0;
        let failed = 0;

        for (const product of products.data) {
            const result = await syncProductToDatabase(product);
            if (result.success) {
                synced++;
            } else {
                failed++;
            }
        }



        return { success: true, synced, failed, total: products.data.length };
    } catch (error) {
        console.error("❌ Error during full sync:", error);
        return { success: false, error };
    }
}
