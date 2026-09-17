/**
 * Script: backfill-product-columns.ts
 * Populates the promoted columns (collection, collectionOrder, featured, tags)
 * from each product's existing `metadata` JSON.
 *
 * Idempotent. Run AFTER applying the migration that adds these columns:
 *   bun prisma/scripts/backfill-product-columns.ts
 */

import { PrismaClient } from "../../lib/generated/prisma";

const prisma = new PrismaClient();

async function main() {
  console.log("\n🔄 Backfilling promoted product columns from metadata...\n");

  const products = await prisma.product.findMany({
    select: { id: true, metadata: true },
  });

  let updated = 0;
  for (const p of products) {
    const meta = (p.metadata as Record<string, string> | null) ?? {};
    await prisma.product.update({
      where: { id: p.id },
      data: {
        collection: meta.collection || null,
        collectionOrder: meta.collection_order
          ? parseInt(meta.collection_order, 10) || null
          : null,
        featured: meta.featured === "true",
        tags: meta.tags
          ? meta.tags.split(",").map((t) => t.trim()).filter(Boolean)
          : [],
      },
    });
    updated++;
  }

  console.log(`✅ Done. updated=${updated} of ${products.length} products\n`);
}

main()
  .catch((err) => {
    console.error("\n❌ Backfill failed:\n", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
