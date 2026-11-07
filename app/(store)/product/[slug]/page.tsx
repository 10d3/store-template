import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/store/container";
import { ProductCard } from "@/components/store/product-card";
import { ProductPurchase } from "@/components/store/product-purchase";
import { ReviewForm } from "@/components/store/review-form";
import { StarRating } from "@/components/store/star-rating";
import {
  getProductBySlug,
  getRelatedProducts,
} from "@/lib/catalog/queries";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Product not found" };

  return {
    title: product.seoTitle || product.name,
    description: product.seoDescription || product.description?.slice(0, 160),
    openGraph: {
      title: product.name,
      description: product.description?.slice(0, 160),
      images: product.images[0]?.url ? [product.images[0].url] : undefined,
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const [related, session] = await Promise.all([
    getRelatedProducts(product.id, product.categoryId),
    getSession(),
  ]);

  const myReview = session
    ? await prisma.review.findUnique({
        where: {
          productId_userId: {
            productId: product.id,
            userId: session.user.id,
          },
        },
        select: { status: true },
      })
    : null;

  return (
    <Container className="py-10">
      <nav className="mb-8 text-sm text-muted-foreground">
        <Link href="/shop" className="hover:text-foreground">
          Shop
        </Link>
        {product.category && (
          <>
            <span className="mx-2">/</span>
            <Link
              href={`/category/${product.category.slug}`}
              className="hover:text-foreground"
            >
              {product.category.name}
            </Link>
          </>
        )}
        <span className="mx-2">/</span>
        <span className="text-foreground">{product.name}</span>
      </nav>

      <ProductPurchase
        product={{
          id: product.id,
          name: product.name,
          slug: product.slug,
          images: product.images.map((image) => ({
            url: image.url,
            alt: image.alt,
          })),
          variants: product.variants.map((variant) => ({
            id: variant.id,
            title: variant.title,
            sku: variant.sku,
            price: variant.price,
            compareAtPrice: variant.compareAtPrice,
            stock: variant.stock,
            trackInventory: variant.trackInventory,
            image: variant.image,
          })),
          rating: product.rating,
          reviewCount: product.reviewCount,
        }}
      />

      {product.description && (
        <section className="mt-16 max-w-3xl border-t border-border/60 pt-10">
          <h2 className="font-serif text-2xl">Details</h2>
          <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
            {product.description}
          </p>
        </section>
      )}

      <section className="mt-16 max-w-3xl border-t border-border/60 pt-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-serif text-2xl">Reviews</h2>
          {product.reviewCount > 0 && (
            <StarRating
              rating={product.rating ?? 0}
              count={product.reviewCount}
            />
          )}
        </div>

        {product.reviews.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">
            No reviews yet. Be the first to share your experience.
          </p>
        ) : (
          <div className="mt-6 space-y-6">
            {product.reviews.map((review) => (
              <article
                key={review.id}
                className="border-b border-border/60 pb-6 last:border-0"
              >
                <div className="flex flex-wrap items-center gap-3">
                  <StarRating
                    rating={review.rating}
                    showCount={false}
                  />
                  {review.title && (
                    <h3 className="font-medium">{review.title}</h3>
                  )}
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span>{review.user.name ?? "Customer"}</span>
                  {review.verifiedPurchase && (
                    <span className="rounded-full bg-muted px-2 py-0.5">
                      Verified purchase
                    </span>
                  )}
                  <span>{review.createdAt.toLocaleDateString()}</span>
                </div>
                {review.body && (
                  <p className="mt-3 whitespace-pre-line text-sm leading-relaxed">
                    {review.body}
                  </p>
                )}
              </article>
            ))}
          </div>
        )}

        <div className="mt-8 rounded-xl border border-border/60 p-5">
          <h3 className="font-medium">Write a review</h3>
          {myReview ? (
            <p className="mt-2 text-sm text-muted-foreground">
              Your review is {myReview.status.toLowerCase()}.
            </p>
          ) : session ? (
            <div className="mt-4">
              <ReviewForm productId={product.id} />
            </div>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">
              <Link href="/login" className="underline underline-offset-4">
                Sign in
              </Link>{" "}
              to write a review.
            </p>
          )}
        </div>
      </section>

      {related.length > 0 && (
        <section className="mt-16 border-t border-border/60 pt-10">
          <h2 className="mb-8 font-serif text-2xl">You may also like</h2>
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-4">
            {related.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </section>
      )}
    </Container>
  );
}
