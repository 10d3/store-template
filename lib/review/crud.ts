"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath, unstable_cache } from "next/cache";

export interface ReviewData {
    userId: string;
    productId: string;
    rating: number;
    comment?: string;
}

export interface ReviewWithUser {
    id: string;
    userId: string;
    productId: string;
    rating: number;
    comment: string | null;
    createdAt: Date;
    updatedAt: Date;
    user: {
        id: string;
        name: string;
        image: string | null;
    };
}

/**
 * Create a new review
 */
export async function createReview(data: ReviewData) {
    const { userId, productId, rating, comment } = data;

    // Check if user already reviewed this product
    const existingReview = await prisma.review.findFirst({
        where: {
            userId,
            productId,
        },
    });

    if (existingReview) {
        // Update existing review
        const updated = await prisma.review.update({
            where: { id: existingReview.id },
            data: {
                rating,
                comment,
                updatedAt: new Date(),
            },
        });
        revalidatePath(`/product`);
        return updated;
    }

    // Create new review
    const review = await prisma.review.create({
        data: {
            id: `rev_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
            userId,
            productId,
            rating,
            comment,
            createdAt: new Date(),
            updatedAt: new Date(),
        },
    });

    revalidatePath(`/product`);
    return review;
}

/**
 * Get all reviews for a product
 */
export const getReviewsByProductId = unstable_cache(async (
    productId: string
): Promise<ReviewWithUser[]> => {
    const reviews = await prisma.review.findMany({
        where: { productId },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    image: true,
                },
            },
        },
        orderBy: {
            createdAt: "desc",
        },
    });

    return reviews;
},
    ["reviews"],
    { revalidate: 60 * 60 }, // 1 hour
);

/**
 * Get average rating for a product
 */
export const getAverageRating = unstable_cache(async (
    productId: string
): Promise<{ average: number; count: number }> => {
    const result = await prisma.review.aggregate({
        where: { productId },
        _avg: { rating: true },
        _count: { rating: true },
    });

    return {
        average: result._avg.rating ?? 0,
        count: result._count.rating,
    };
},
    ["reviews"],
    { revalidate: 60 * 60 }, // 1 hour
);

/**
 * Delete a review (only by owner)
 */
export async function deleteReview(reviewId: string, userId: string) {
    const review = await prisma.review.findUnique({
        where: { id: reviewId },
    });

    if (!review || review.userId !== userId) {
        throw new Error("Unauthorized");
    }

    await prisma.review.delete({
        where: { id: reviewId },
    });

    revalidatePath(`/product`);
    return { success: true };
}
