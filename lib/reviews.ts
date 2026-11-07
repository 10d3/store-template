import { prisma } from "@/lib/prisma";

export async function refreshProductRating(productId: string) {
  const aggregate = await prisma.review.aggregate({
    where: { productId, status: "APPROVED" },
    _avg: { rating: true },
    _count: { _all: true },
  });

  await prisma.product.update({
    where: { id: productId },
    data: {
      rating: aggregate._avg.rating,
      reviewCount: aggregate._count._all,
    },
  });
}
