/**
 * Script: resync-stripe-products.ts
 * Fetches ALL active products + prices from Stripe (live) and upserts them into the DB.
 * Safe to run multiple times — uses upsert so nothing is duplicated.
 *
 * Delegates to the shared, variant-aware sync helpers in lib/product/product-sync:
 * each Stripe price updates the legacy Price row AND mirrors onto
 * ProductVariant.price (the source of truth for checkout).
 *
 * Usage:
 *   bun prisma/scripts/resync-stripe-products.ts
 *
 * Make sure STRIPE_SECRET_KEY in .env points to your LIVE key before running.
 */

import Stripe from "stripe";
import { prisma } from "../../lib/prisma";
import {
    syncProductToDatabase,
    syncPriceToDatabase,
} from "../../lib/product/product-sync";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { typescript: true });

async function main() {
    console.log("\n🔄 Starting Stripe → DB resync...\n");

    // ── 1. Fetch all active products from Stripe (paginated) ───────────────────
    const products: Stripe.Product[] = [];
    for await (const product of stripe.products.list({ active: true, limit: 100 })) {
        products.push(product);
    }
    console.log(`📦 Found ${products.length} active products in Stripe`);

    // ── 2. Upsert each product into the DB ─────────────────────────────────────
    let productCount = 0;
    let priceCount = 0;
    let errorCount = 0;

    for (const product of products) {
        try {
            const productResult = await syncProductToDatabase(product);
            if (!productResult.success) {
                throw productResult.error instanceof Error
                    ? productResult.error
                    : new Error("syncProductToDatabase failed");
            }
            productCount++;

            // ── 3. Fetch all prices for this product ─────────────────────────────
            const prices: Stripe.Price[] = [];
            for await (const price of stripe.prices.list({ product: product.id, limit: 100 })) {
                prices.push(price);
            }

            // Determine the default price
            const defaultPriceId =
                typeof product.default_price === "string"
                    ? product.default_price
                    : product.default_price?.id ?? null;

            // Upsert each price (variant-aware).
            for (const price of prices) {
                const result = await syncPriceToDatabase(
                    price,
                    price.id === defaultPriceId
                );
                if (!result.success) {
                    throw result.error instanceof Error
                        ? result.error
                        : new Error("syncPriceToDatabase failed");
                }
                priceCount++;
            }

            console.log(`  ✅ ${product.name} (${prices.length} price(s))`);
        } catch (e) {
            console.error(`  ❌ Failed to sync product ${product.id}:`, (e as Error).message);
            errorCount++;
        }
    }

    // ── 4. Soft-delete DB products that no longer exist in Stripe ──────────────
    const stripeIds = new Set(products.map((p) => p.id));
    const dbProducts = await prisma.product.findMany({ select: { id: true } });
    const staleIds = dbProducts.map((p) => p.id).filter((id) => !stripeIds.has(id));

    if (staleIds.length > 0) {
        await prisma.product.updateMany({
            where: { id: { in: staleIds } },
            data: { active: false },
        });
        console.log(`\n🗑️  Soft-deleted ${staleIds.length} stale product(s) not found in Stripe`);
    }

    console.log(`
✅ Resync complete!
   Products synced: ${productCount}
   Prices synced:   ${priceCount}
   Errors:          ${errorCount}
   Stale removed:   ${staleIds.length}
`);
}

main()
    .catch((e) => {
        console.error("\n❌ Fatal error:", e.message);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
