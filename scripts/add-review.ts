import { prisma } from "@/lib/prisma";
import reviewData from "./reviews.json";

async function addReviews() {
    console.log("🚀 Starting review import...\n");

    for (const productGroup of reviewData) {
        console.log(`📦 Product: ${productGroup.product_id}`);

        for (const review of productGroup.reviews) {
            try {
                // Normalize email generation
                const userEmail = `${review.author_full
                    .toLowerCase()
                    .trim()
                    .replace(/\s+/g, ".")}@gmail.com`;

                // 1. Upsert User
                const user = await prisma.user.upsert({
                    where: { email: userEmail },
                    update: {
                        name: review.author_full,
                        updatedAt: review.createdAt,
                    },
                    create: {
                        name: review.author_full,
                        email: userEmail,
                        emailVerified: true,
                        createdAt: review.createdAt,
                        updatedAt: review.createdAt,
                    },
                });

                // 2. Upsert Review (update if exists)
                await prisma.review.upsert({
                    where: {
                        productId_userId: {
                            productId: productGroup.product_id,
                            userId: user.id,
                        },
                    },
                    update: {
                        rating: review.rating,
                        comment: review.comment,
                        updatedAt: review.createdAt,
                        createdAt: review.createdAt,
                    },
                    create: {
                        productId: productGroup.product_id,
                        rating: review.rating,
                        comment: review.comment,
                        userId: user.id,
                        createdAt: review.createdAt,
                        updatedAt: review.createdAt,
                    },
                });

                console.log(`✅ Review synced: ${review.author_full}`);
            } catch (error) {
                console.error(
                    `❌ Failed review for ${review.author_full}:`,
                    error
                );
            }
        }

        console.log("");
    }

    console.log("✨ Review import completed successfully.");
}

async function main() {
    await addReviews();
}

main()
    .catch((error) => {
        console.error("🔥 Fatal error:", error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
