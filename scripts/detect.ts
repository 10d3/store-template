import { prisma } from "@/lib/prisma";

async function findOrphanNutrition() {
    // Get all nutrition productIds
    const nutritions = await prisma.productNutrition.findMany({
        select: { productId: true },
    });

    if (nutritions.length === 0) {
        return [];
    }

    // Get all existing product IDs
    const products = await prisma.product.findMany({
        where: {
            id: { in: nutritions.map(n => n.productId) },
        },
        select: { id: true },
    });

    const productIdSet = new Set(products.map(p => p.id));

    // Filter orphan rows
    const orphans = nutritions.filter(
        n => !productIdSet.has(n.productId)
    );

    return orphans;
}

async function main() {
    const orphans = await findOrphanNutrition();
    console.log(orphans);
}


main().catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
});