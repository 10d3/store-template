"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@/lib/generated/prisma";
import type { ReviewStatus } from "@/lib/generated/prisma";
import { prisma } from "@/lib/prisma";
import { getSession, requireAdminAction } from "@/lib/session";
import { refreshProductRating } from "@/lib/reviews";

export interface ReviewFormState {
  success?: boolean;
  error?: string;
}

const statuses: ReviewStatus[] = ["PENDING", "APPROVED", "REJECTED"];

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function createReview(
  _state: ReviewFormState,
  formData: FormData
): Promise<ReviewFormState> {
  const session = await getSession();
  if (!session) return { error: "Please sign in to write a review." };

  const productId = text(formData, "productId");
  const rating = Number(text(formData, "rating"));
  const title = text(formData, "title").slice(0, 120) || null;
  const body = text(formData, "body");

  if (!productId) return { error: "Product is missing." };
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return { error: "Choose a rating from 1 to 5 stars." };
  }
  if (body.length < 10) {
    return { error: "Please write at least a few words." };
  }
  if (body.length > 2000) {
    return { error: "Review is too long." };
  }

  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { id: true, slug: true, status: true },
  });
  if (!product || product.status !== "ACTIVE") {
    return { error: "This product is not available." };
  }

  const existing = await prisma.review.findUnique({
    where: {
      productId_userId: { productId, userId: session.user.id },
    },
    select: { id: true },
  });
  if (existing) return { error: "You have already reviewed this product." };

  const purchased = await prisma.orderItem.findFirst({
    where: {
      variant: { is: { productId } },
      order: {
        userId: session.user.id,
        status: { in: ["PAID", "FULFILLED"] },
      },
    },
    select: { id: true },
  });

  try {
    await prisma.review.create({
      data: {
        productId,
        userId: session.user.id,
        rating,
        title,
        body,
        verifiedPurchase: Boolean(purchased),
      },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return { error: "You have already reviewed this product." };
    }
    console.error("[reviews] create failed:", error);
    return { error: "Could not submit your review. Please try again." };
  }

  revalidatePath(`/product/${product.slug}`);
  revalidatePath("/admin/reviews");
  return { success: true };
}

export async function updateReviewStatus(formData: FormData) {
  await requireAdminAction();

  const id = text(formData, "id");
  const status = text(formData, "status") as ReviewStatus;
  if (!id || !statuses.includes(status)) return;

  const review = await prisma.review.findUnique({
    where: { id },
    select: { productId: true, product: { select: { slug: true } } },
  });
  if (!review) return;

  await prisma.review.update({ where: { id }, data: { status } });
  await refreshProductRating(review.productId);
  revalidatePath("/admin/reviews");
  revalidatePath(`/product/${review.product.slug}`);
  revalidatePath("/");
  revalidatePath("/shop");
}

export async function deleteReview(formData: FormData) {
  await requireAdminAction();

  const id = text(formData, "id");
  if (!id) return;

  const review = await prisma.review.findUnique({
    where: { id },
    select: { productId: true, product: { select: { slug: true } } },
  });
  if (!review) return;

  await prisma.review.delete({ where: { id } });
  await refreshProductRating(review.productId);
  revalidatePath("/admin/reviews");
  revalidatePath(`/product/${review.product.slug}`);
  revalidatePath("/");
  revalidatePath("/shop");
}
