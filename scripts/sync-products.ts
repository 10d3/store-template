/**
 * Sync all Stripe products to the database
 * Run with: bun run scripts/sync-products.ts
 */

import { syncAllProducts } from "../lib/product/product-sync";

async function main() {
    console.log("🚀 Starting product sync...\n");

    const result = await syncAllProducts();

    if (result.success) {
        console.log("\n✅ Sync completed successfully!");
        console.log(`   📦 Total products: ${result.total}`);
        console.log(`   ✓ Synced: ${result.synced}`);
        console.log(`   ✗ Failed: ${result.failed}`);
    } else {
        console.error("\n❌ Sync failed:", result.error);
        process.exit(1);
    }
}

main().catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
});
