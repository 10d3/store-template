import { prisma } from "@/lib/prisma";

function normalizeSlug(value?: unknown): string | undefined {
    if (typeof value !== "string") return undefined;

    return value
        .toLowerCase()
        .trim()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "");
}

async function fillBlank() {
    console.log("Filling missing product fields...");
    console.log("====== BEGIN ======");

    const products = await prisma.product.findMany({
        select: {
            id: true,
            slug: true,
            category: true,
            gender: true,
            type: true,
            metadata: true,
        },
    });

    let updatedCount = 0;

    for (const product of products) {
        const metadata = product.metadata as Record<string, unknown> | null;

        if (!metadata) continue;

        const data: Record<string, string> = {};

        if (!product.slug) {
            const slug = normalizeSlug(metadata.slug);
            if (slug) data.slug = slug;
        }

        if (!product.category && typeof metadata.category === "string") {
            data.category = metadata.category;
        }

        if (!product.gender && typeof metadata.gender === "string") {
            data.gender = metadata.gender;
        }

        if (!product.type && typeof metadata.type === "string") {
            data.type = metadata.type;
        }

        if (Object.keys(data).length === 0) continue;

        await prisma.product.update({
            where: { id: product.id },
            data,
        });

        updatedCount++;
        console.log(`Updated product ${product.id}`, data);
    }

    console.log(`====== END | Updated ${updatedCount} products ======`);
}

async function main() {
    console.log("🚀 Starting product backfill...\n");
    await fillBlank();
    console.log("\n🚀 Product backfill completed");
}

main().catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
});
