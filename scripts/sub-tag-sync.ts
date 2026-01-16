import { prisma } from "@/lib/prisma";
import tagSubData from "./tag-sub.json";

async function syncProductMetadata() {
    console.log("🚀 Starting product metadata sync...\n");

    for (const product of tagSubData.products) {
        console.log(`📦 Product: ${product.id}`);

        try {
            await prisma.product.upsert({
                where: { id: product.id },
                update: {
                    name: product.name,
                    subtitle: product.subtitle ?? null,
                    tagline: product.tagline ?? null,
                    slug: product.slug,
                    updatedAt: new Date(),
                },
                create: {
                    id: product.id,
                    name: product.name,
                    subtitle: product.subtitle ?? null,
                    tagline: product.tagline ?? null,
                    slug: product.slug,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
            });

            console.log(`✅ Product synced: ${product.id}`);
        } catch (error) {
            console.error(`❌ Failed syncing product ${product.id}`, error);
        }

        console.log("");
    }

    console.log("✨ Product metadata sync completed.");
}

async function main() {
    await syncProductMetadata();
}

main()
    .catch((error) => {
        console.error("🔥 Fatal error:", error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
