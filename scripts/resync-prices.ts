import Stripe from "stripe";
import { prisma } from "../lib/prisma";

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
