import Stripe from "stripe";
import { prisma } from "../lib/prisma";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .substring(0, 100);
}

async function fixPackSlugs() {
  console.log("🔧 Fixing packs without slugs...\n");

  let fixed = 0;
  let skipped = 0;
  let hasMore = true;
  let startingAfter: string | undefined;

  while (hasMore) {
    const products = await stripe.products.list({
      limit: 100,
      starting_after: startingAfter,
    });

    for (const product of products.data) {
      const metadata = product.metadata as Record<string, string>;
      
      if (metadata.type !== "bundle") {
        continue;
      }

      if (metadata.slug && metadata.slug.length > 0) {
        skipped++;
        continue;
      }

      const baseSlug = generateSlug(product.name);
      const slug = `${baseSlug}-${product.id.slice(-6)}`;
      
      console.log(`  Fixing: ${product.name} → ${slug}`);
      
      await stripe.products.update(product.id, {
        metadata: {
          ...metadata,
          slug,
        },
      });

      await prisma.product.upsert({
        where: { id: product.id },
        update: { slug },
        create: {
          id: product.id,
          name: product.name,
          description: product.description,
          images: product.images || [],
          active: product.active,
          type: metadata.type || "bundle",
          slug,
          metadata: product.metadata as object,
        },
      });

      fixed++;
    }

    hasMore = products.has_more;
    startingAfter = products.data[products.data.length - 1]?.id;
  }

  console.log(`\n✅ Done! Fixed: ${fixed}, Skipped (already had slug): ${skipped}`);
}

fixPackSlugs()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
