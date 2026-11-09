import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/store/container";
import { ProductCard } from "@/components/store/product-card";
import { ProductPurchase } from "@/components/store/product-purchase";
import { ReviewForm } from "@/components/store/review-form";
import { StarRating } from "@/components/store/star-rating";
import { Button } from "@/components/ui/button";
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

const faqs = [
  {
    question: "How long does shipping take?",
    answer:
      "Orders ship within 1–2 business days. Standard delivery takes 3–5 business days, and shipping is free on orders over $50.",
  },
  {
    question: "What is your return policy?",
    answer:
      "Unopened products can be returned within 30 days of delivery. Contact us and we will guide you through the process.",
  },
  {
    question: "Can I take this with other supplements?",
    answer:
      "If you take medication, are pregnant or nursing, or have a medical condition, speak with your healthcare provider before adding a new supplement to your routine.",
  },
];

const brandPoints = [
  "Clean, considered formulas",
  "Third-party tested ingredients",
  "Made for everyday routines",
];

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

  const storyImage =
    product.images[1]?.url ?? "/Gemini_Generated_Image_ofv3b4ofv3b4ofv3.png";

  return (
    <Container className="py-8 md:py-12">
      <nav className="mb-8 text-xs uppercase tracking-[0.16em] text-muted-foreground">
        <Link href="/shop" className="hover:text-brand">
          Shop
        </Link>
        {product.category && (
          <>
            <span className="mx-2">/</span>
            <Link
              href={`/category/${product.category.slug}`}
              className="hover:text-brand"
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
        <section className="mt-20 grid gap-10 border-t pt-14 md:grid-cols-2 md:gap-16">
          <div className="relative aspect-[4/3] overflow-hidden rounded-3xl bg-white shadow-sm">
            <Image
              src={storyImage}
              alt={`${product.name} detail`}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
            />
          </div>
          <div className="flex flex-col justify-center">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
              Why Vitanou
            </p>
            <h2 className="mt-3 font-serif text-3xl font-light md:text-4xl">
              Made with care, chosen with intention.
            </h2>
            <p className="mt-5 whitespace-pre-line leading-relaxed text-muted-foreground">
              {product.description}
            </p>
            <ul className="mt-6 space-y-3 text-sm">
              {brandPoints.map((point) => (
                <li key={point} className="flex items-center gap-3">
                  <span className="size-1.5 rounded-full bg-leaf" />
                  {point}
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      <section className="mx-auto mt-20 max-w-3xl">
        <h2 className="text-center font-serif text-3xl font-light md:text-4xl">
          Frequently asked questions
        </h2>
        <div className="mt-8 divide-y divide-border rounded-3xl border bg-card px-6">
          {faqs.map((faq) => (
            <details key={faq.question} className="group py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-medium">
                {faq.question}
                <span className="text-muted-foreground transition group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {faq.answer}
              </p>
            </details>
          ))}
        </div>
      </section>

      <section className="mx-auto mt-20 max-w-3xl border-t pt-14">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-serif text-3xl font-light md:text-4xl">Reviews</h2>
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
                className="border-b pb-6 last:border-0"
              >
                <div className="flex flex-wrap items-center gap-3">
                  <StarRating rating={review.rating} showCount={false} />
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

        <div className="mt-8 rounded-3xl border bg-card p-6">
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
        <section className="mt-20 border-t pt-14">
          <h2 className="mb-8 font-serif text-3xl font-light md:text-4xl">
            You may also like
          </h2>
          <div className="grid grid-cols-2 gap-5 md:grid-cols-4">
            {related.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </section>
      )}

      <section className="mt-20 rounded-[2rem] bg-brand px-8 py-12 text-center text-white md:py-16">
        <h2 className="mx-auto max-w-2xl font-serif text-3xl font-light tracking-tight text-balance md:text-5xl">
          Support your routine from the inside out.
        </h2>
        <Button
          asChild
          size="lg"
          className="mt-7 rounded-full bg-white px-8 text-brand hover:bg-white/90"
        >
          <Link href="/shop">Shop all products</Link>
        </Button>
      </section>
    </Container>
  );
}
