/**
 * Script: backfill-variants.ts
 * Creates one ProductVariant per existing active Price so the new variant model
 * is populated from the current "slug-grouping + multiple prices" data.
 *
 * Idempotent: skips any Price that already has a variant (matched on stripePriceId).
 *
 * Run AFTER applying the Phase 1 migration:
 *   bun prisma/scripts/backfill-variants.ts
 */

import { PrismaClient } from "../../lib/generated/prisma";

const prisma = new PrismaClient();

async function main() {
  console.log("\n🔄 Backfilling ProductVariant rows from existing prices...\n");

  const prices = await prisma.price.findMany({
    where: { active: true },
    select: {
      id: true,
      productId: true,
      image: true,
      active: true,
      metadata: true,
    },
  });

  // Which prices already have a variant?
  const existing = await prisma.productVariant.findMany({
    where: { stripePriceId: { in: prices.map((p) => p.id) } },
    select: { stripePriceId: true },
  });
  const done = new Set(existing.map((v) => v.stripePriceId));

  let created = 0;
  let skipped = 0;

  for (const price of prices) {
    if (done.has(price.id)) {
      skipped++;
      continue;
    }

    const meta = (price.metadata as Record<string, string> | null) ?? {};
    // Promote the variant descriptors currently living in Stripe Price metadata
    // (color/size/pack_size/variant) into structured ProductVariant.options.
    const options: Record<string, string> = {};
    if (meta.color) options.color = meta.color;
    if (meta.size) options.size = meta.size;
    if (meta.pack_size) options.pack_size = meta.pack_size;
    if (meta.variant) options.variant = meta.variant;

    await prisma.productVariant.create({
      data: {
        productId: price.productId,
        stripePriceId: price.id,
        sku: meta.sku ?? null,
        options,
        image: price.image ?? null,
        active: price.active,
        stock: 0, // manual products keep trackInventory=false, so stock is not enforced
      },
    });
    created++;
  }

  console.log(`✅ Done. created=${created}, skipped(existing)=${skipped}, totalPrices=${prices.length}\n`);
}

main()
  .catch((err) => {
    console.error("\n❌ Backfill failed:\n", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
