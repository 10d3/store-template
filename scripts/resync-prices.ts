import Stripe from "stripe";
import { syncPriceToDatabase } from "../lib/product/product-sync";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

async function resyncAllPrices() {
    console.log("🔄 Resyncing all Stripe prices to populate metadata...\n");

    let synced = 0;
    let failed = 0;
    let hasMore = true;
    let startingAfter: string | undefined;

    while (hasMore) {
        const prices = await stripe.prices.list({
            limit: 100,
            expand: ["data.product"],
            starting_after: startingAfter,
        });

        for (const price of prices.data) {
            try {
                const productId =
                    typeof price.product === "string" ? price.product : price.product.id;

                const product = await stripe.products.retrieve(productId);
                const isDefault = product.default_price === price.id;

                // Delegates to the shared, variant-aware sync: upserts the legacy
                // Price row AND mirrors onto ProductVariant.price (source of truth).
                const result = await syncPriceToDatabase(price, isDefault);
                if (!result.success) {
                    throw result.error instanceof Error
                        ? result.error
                        : new Error("syncPriceToDatabase failed");
                }

                synced++;
                if (price.metadata?.pack_size) {
                    console.log(`  ✓ ${price.id} (pack_size: ${price.metadata.pack_size})`);
                }
            } catch (error) {
                console.error(`  ✗ Failed to sync price ${price.id}:`, error);
                failed++;
            }
        }

        hasMore = prices.has_more;
        startingAfter = prices.data[prices.data.length - 1]?.id;
    }

    console.log(`\n✅ Done! Synced: ${synced}, Failed: ${failed}`);
}

resyncAllPrices()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("Fatal error:", error);
        process.exit(1);
    });
