import Link from "next/link";
import type { Prisma, ReviewStatus } from "@/lib/generated/prisma";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { StarRating } from "@/components/store/star-rating";
import { deleteReview, updateReviewStatus } from "@/lib/reviews/actions";
import { ConfirmSubmit } from "@/components/admin/confirm-submit";

export const metadata = { title: "Reviews" };

const statuses: ReviewStatus[] = ["PENDING", "APPROVED", "REJECTED"];

export default async function AdminReviewsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requireAdmin();
  const { status } = await searchParams;

  const where: Prisma.ReviewWhereInput = {};
  if (status && statuses.includes(status as ReviewStatus)) {
    where.status = status as ReviewStatus;
  }

  const reviews = await prisma.review.findMany({
    where,
    include: {
      product: { select: { name: true, slug: true } },
      user: { select: { name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl">Reviews</h1>
        <p className="text-sm text-muted-foreground">
          {reviews.length} shown · approve reviews to publish them
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Link
          href="/admin/reviews"
          className={`rounded-full border px-3 py-1 text-xs ${
            !status ? "border-foreground bg-foreground text-background" : "border-border"
          }`}
        >
          All
        </Link>
        {statuses.map((value) => (
          <Link
            key={value}
            href={`/admin/reviews?status=${value}`}
            className={`rounded-full border px-3 py-1 text-xs ${
              status === value
                ? "border-foreground bg-foreground text-background"
                : "border-border"
            }`}
          >
            {value}
          </Link>
        ))}
      </div>

      {reviews.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
          No reviews found.
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <article
              key={review.id}
              className="rounded-xl border border-border/60 bg-background p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <Link
                    href={`/product/${review.product.slug}`}
                    className="font-medium underline-offset-4 hover:underline"
                  >
                    {review.product.name}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    {review.user.name ?? "Customer"} · {review.user.email}
                  </p>
                </div>
                <span className="rounded-full bg-muted px-2.5 py-1 text-xs">
                  {review.status}
                </span>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <StarRating rating={review.rating} showCount={false} />
                {review.verifiedPurchase && (
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs">
                    Verified purchase
                  </span>
                )}
                <span className="text-xs text-muted-foreground">
                  {review.createdAt.toLocaleDateString()}
                </span>
              </div>

              {review.title && (
                <h2 className="mt-3 font-medium">{review.title}</h2>
              )}
              {review.body && (
                <p className="mt-1 whitespace-pre-line text-sm text-muted-foreground">
                  {review.body}
                </p>
              )}

              <div className="mt-4 flex flex-wrap gap-2">
                {review.status !== "APPROVED" && (
                  <form action={updateReviewStatus}>
                    <input type="hidden" name="id" value={review.id} />
                    <input type="hidden" name="status" value="APPROVED" />
                    <button className="rounded-md border border-border px-3 py-1 text-xs">
                      Approve
                    </button>
                  </form>
                )}
                {review.status !== "REJECTED" && (
                  <form action={updateReviewStatus}>
                    <input type="hidden" name="id" value={review.id} />
                    <input type="hidden" name="status" value="REJECTED" />
                    <button className="rounded-md border border-border px-3 py-1 text-xs">
                      Reject
                    </button>
                  </form>
                )}
                <form action={deleteReview}>
                  <input type="hidden" name="id" value={review.id} />
                  <ConfirmSubmit
                    message="Delete this review permanently?"
                    className="rounded-md border border-destructive/40 px-3 py-1 text-xs text-destructive"
                  >
                    Delete
                  </ConfirmSubmit>
                </form>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
