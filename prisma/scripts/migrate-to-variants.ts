/**
 * Script: migrate-to-variants.ts
 *
 * ⚠️ ONE-TIME TOOL — targets the pre-variant schema migration. Historical
 *    backfill only; not part of the steady-state Stripe ↔ DB sync.
 *
 * Backfill script for the Product → Variant architecture migration.
 * Run AFTER applying the Prisma migration:
 *   pnpm prisma migrate dev --name add_variant_price_bundle_items_order_line_items
 *
 * Then run this script:
 *   pnpm exec ts-node --project tsconfig.json -e "require('./prisma/scripts/migrate-to-variants.ts')"
 *   OR via tsx:
 *   pnpm exec tsx prisma/scripts/migrate-to-variants.ts
 *
 * What this script does:
 *   1. For every ProductVariant that has a linked stripePriceId: copies
 *      Price.unitAmount → ProductVariant.price (and compareAtPrice if a
 *      corresponding "was" price metadata key exists).
 *   2. For every Product that has NO variants at all: creates one default
 *      variant ("Default") using the product's active default Price.
 *   3. Copies ProductNutrition.nutrition → Product.nutrition for every product
 *      that has a ProductNutrition row.
 *
 * Idempotent: safe to run multiple times. Each step checks before writing.
 */

import { PrismaClient } from "../../lib/generated/prisma";

const prisma = new PrismaClient();

// ─── Step helpers ────────────────────────────────────────────────────────────

async function step1_backfillVariantPrices() {
  console.log("\n📦 Step 1: Backfill ProductVariant.price from linked Price rows…\n");

  const variants = await prisma.productVariant.findMany({
    where: {
      stripePriceId: { not: null },
      price: 0, // only those not yet backfilled
    },
    select: { id: true, stripePriceId: true },
  });

  console.log(`  Found ${variants.length} variants with price=0 and a linked stripePriceId`);

  let updated = 0;
  let skipped = 0;

  for (const v of variants) {
    const priceRow = await prisma.price.findUnique({
      where: { id: v.stripePriceId! },
      select: { unitAmount: true },
    });

    if (!priceRow) {
      console.warn(`  ⚠️  No Price row found for stripePriceId=${v.stripePriceId} (variant ${v.id}) — skipping`);
      skipped++;
      continue;
    }

    await prisma.productVariant.update({
      where: { id: v.id },
      data: { price: priceRow.unitAmount },
    });
    updated++;
  }

  console.log(`  ✅ Done: updated=${updated}, skipped=${skipped}\n`);
}

async function step2_createDefaultVariants() {
  console.log("📦 Step 2: Create default variants for products that have none…\n");

  // Find products that have no variants at all
  const products = await prisma.product.findMany({
    where: {
      variants: { none: {} },
      active: true,
    },
    include: {
      prices: {
        where: { active: true },
        orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
        take: 1,
      },
    },
  });

  console.log(`  Found ${products.length} products with no variants`);

  let created = 0;
  let skipped = 0;

  for (const product of products) {
    const defaultPrice = product.prices[0];

    if (!defaultPrice) {
      console.warn(`  ⚠️  Product ${product.id} (${product.name}) has no active price — skipping default variant creation`);
      skipped++;
      continue;
    }

    await prisma.productVariant.create({
      data: {
        productId: product.id,
        title: "Default",
        position: 0,
        price: defaultPrice.unitAmount,
        options: {},
        stock: 0,
        trackInventory: false,
        stripePriceId: defaultPrice.id,
        active: true,
      },
    });

    created++;
    console.log(`  ✅ Created default variant for: ${product.name} (${product.id}) @ ${defaultPrice.unitAmount}¢`);
  }

  console.log(`\n  Done: created=${created}, skipped=${skipped}\n`);
}

async function step3_migrateNutrition() {
  console.log("📦 Step 3: Migrate ProductNutrition → Product.nutrition…\n");

  const nutritionRows = await prisma.productNutrition.findMany({
    select: { productId: true, nutrition: true },
  });

  console.log(`  Found ${nutritionRows.length} ProductNutrition rows`);

  let updated = 0;
  let skipped = 0;

  for (const row of nutritionRows) {
    // Check if the product exists and doesn't already have nutrition set
    const product = await prisma.product.findUnique({
      where: { id: row.productId },
      select: { id: true, nutrition: true },
    });

    if (!product) {
      console.warn(`  ⚠️  No Product found for productId=${row.productId} — skipping`);
      skipped++;
      continue;
    }

    if (product.nutrition) {
      // Already backfilled — skip
      skipped++;
      continue;
    }

    await prisma.product.update({
      where: { id: row.productId },
      data: { nutrition: row.nutrition },
    });
    updated++;
  }

  console.log(`  ✅ Done: updated=${updated}, skipped=${skipped}\n`);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("════════════════════════════════════════════════════════");
  console.log("  Product → Variant Architecture Backfill Migration");
  console.log("════════════════════════════════════════════════════════");

  await step1_backfillVariantPrices();
  await step2_createDefaultVariants();
  await step3_migrateNutrition();

  console.log("════════════════════════════════════════════════════════");
  console.log("  ✅ Backfill complete!");
  console.log("════════════════════════════════════════════════════════\n");
}

main()
  .catch((err) => {
    console.error("\n❌ Backfill failed:\n", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
