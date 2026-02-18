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
        console.log(`📦 Syncing product ${product.id} to database...`);

        // Get the default price if it exists
        let defaultPrice: Stripe.Price | null = null;
        if (product.default_price) {
            if (typeof product.default_price === "string") {
                defaultPrice = await stripe.prices.retrieve(product.default_price);
            } else {
                defaultPrice = product.default_price;
            }
        }

        // Upsert the product
        await prisma.product.upsert({
            where: { id: product.id },
            update: {
                name: product.name,
                description: product.description || null,
                images: product.images || [],
                active: product.active,
                metadata: product.metadata as object,
                updatedAt: new Date(),
            },
            create: {
                id: product.id,
                name: product.name,
                description: product.description || null,
                images: product.images || [],
                active: product.active,
                metadata: product.metadata as object,
            },
        });

        // Sync the default price if exists
        if (defaultPrice) {
            await syncPriceToDatabase(defaultPrice, true);
        }

        console.log(`✅ Product ${product.id} synced successfully`);
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
        console.log(`🗑️ Soft deleting product ${productId}...`);

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

        console.log(`✅ Product ${productId} soft deleted`);
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

        console.log(`💰 Syncing price ${price.id} for product ${productId}...`);

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
                image: price.metadata?.image || null,
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
            },
        });

        console.log(`✅ Price ${price.id} synced successfully`);
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
        console.log(`🗑️ Deleting price ${priceId}...`);

        await prisma.price.update({
            where: { id: priceId },
            data: {
                active: false,
                updatedAt: new Date(),
            },
        });

        console.log(`✅ Price ${priceId} deleted`);
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
        console.log("🔄 Starting full product sync...");

        // Fetch all active products from Stripe
        const products = await stripe.products.list({
            active: true,
            limit: 100,
            expand: ["data.default_price"],
        });

        console.log(`📦 Found ${products.data.length} products to sync`);

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

        console.log(
            `✅ Sync complete: ${synced} synced, ${failed} failed out of ${products.data.length} products`
        );

        return { success: true, synced, failed, total: products.data.length };
    } catch (error) {
        console.error("❌ Error during full sync:", error);
        return { success: false, error };
    }
}
