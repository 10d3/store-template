import { getBaseURL } from "@/lib/utils";

import { MarketingHeroV2 } from "@/components/shared/marketing/MarketingHeroV2";
import { ScienceTable } from "@/components/shared/marketing/ScienceTable";
import { SplitFeatureSection } from "@/components/shared/marketing/SplitFeatureSection";
import { TestimonialCarousel } from "@/components/shared/marketing/TestimonialCarousel";
import { FAQAccordion } from "@/components/shared/marketing/FAQAccordion";
import { BottomCTA } from "@/components/shared/marketing/BottomCTA";
import { FadeIn } from "@/components/shared/animations/fade-in";

import { PackCardNew } from "@/components/shared/product/product-card";
import { Markdown } from "@/components/shared/markdown";
import CardAnyText from "@/components/shared/card-any-text";
import { MarkdownNutrition } from "@/components/shared/nutrition-label";
import { StickyBottom } from "@/components/shared/sticky-bottom";
import { getReviewsByProductId, getAverageRating } from "@/lib/review/crud";
import StarRating from "@/components/shared/star-rating";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ReviewsClient from "@/components/shared/review-client";
import RelatedProductsClient from "@/components/shared/related-product-client";

// ── NEW: unified catalog ───────────────────────────────────────────────────────
import {
  getCachedProduct,
  getCachedRelatedProducts,
  getCachedBundlesForProduct,
} from "@/lib/catalog";
import ProductPurchaseSection from "@/components/catalog/product-purchase-section";

// Generate metadata for SEO and OG
// Helper to strip markdown formatting
function stripMarkdown(text: string): string {
  return text
    .replace(/#{1,6}\s?/g, '') // Remove headers
    .replace(/\*\*([^*]+)\*\*/g, '$1') // Bold
    .replace(/\*([^*]+)\*/g, '$1') // Italic
    .replace(/__([^_]+)__/g, '$1') // Bold alt
    .replace(/_([^_]+)_/g, '$1') // Italic alt
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Links
    .replace(/`([^`]+)`/g, '$1') // Inline code
    .replace(/```[\s\S]*?```/g, '') // Code blocks
    .replace(/>\s?/g, '') // Blockquotes
    .replace(/[-*+]\s/g, '') // List items
    .replace(/\n{2,}/g, ' ') // Multiple newlines
    .replace(/\n/g, ' ') // Single newlines
    .trim();
}

export async function generateMetadata(props: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const params = await props.params;
  const rawProduct = await getCachedProduct(params.slug);

  if (!rawProduct) {
    return {
      title: "Product Not Found",
    };
  }

  const product = rawProduct;
  const seoTitle = product.metadata?.seo_title || product.name;

  // Strip markdown from description
  const rawDescription = product.metadata?.seo_description || product.description || `Shop ${product.name} at our store`;
  const seoDescription = stripMarkdown(rawDescription).slice(0, 180);

  // Get product image
  const productImage = product.images?.[0] || "";

  // Get tags from metadata
  const tags = product.metadata?.tags?.split(',').map((t: string) => t.trim()) || [];

  // Get price
  const price = product.defaultVariant?.price
    ? `$${(product.defaultVariant.price / 100).toFixed(2)}`
    : "";

  // Build OG image URL
  let ogImageUrl = `${getBaseURL()}/api/og?template=ecommerce-product&title=${encodeURIComponent(product.name)}&description=${encodeURIComponent(stripMarkdown(rawDescription).slice(0, 100))}`;

  // Add image
  if (productImage) ogImageUrl += `&image=${encodeURIComponent(productImage)}`;

  // Add price
  if (price) ogImageUrl += `&price=${encodeURIComponent(price)}`;

  // Add tag
  if (tags.length > 0) ogImageUrl += `&tags=${encodeURIComponent(tags.slice(0, 3).join(","))}`;

  return {
    title: seoTitle,
    description: seoDescription,
    openGraph: {
      title: seoTitle,
      description: seoDescription,
      type: "website",
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: product.name,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: seoTitle,
      description: seoDescription,
      images: [ogImageUrl],
    },
  };
}

export default async function page(props: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ variant?: string; image?: string }>;
}) {
  const params = await props.params;

  const rawProduct = await getCachedProduct(params.slug);
  if (!rawProduct) {
    notFound();
  }

  const product = rawProduct;

  const [relatedRaw, reviews, ratingData, bundleProducts] = await Promise.all([
    getCachedRelatedProducts(rawProduct.id, 4),
    getReviewsByProductId(rawProduct.id),
    getAverageRating(rawProduct.id),
    getCachedBundlesForProduct(rawProduct.id),
  ]);

  const relatedProducts = relatedRaw;

  const { average: averageRating, count: reviewCount } = ratingData;
  const images = product.images?.slice(0, 5) ?? [];

  const defaultPrice = product.defaultVariant?.price ?? product.variants[0]?.price;

  // Helper to parse JSON from metadata
  const parseJson = (str: string | undefined, def: any = []) => {
    try { return str ? JSON.parse(str) : def; } catch (e) { return def; }
  };

  // Default mock data tailored to the new design
  const defaultIngredients = [
    { name: "Vitamin D3", amount: "25 (1,000 I.E.)", function: "Supports bone density and calcium absorption" },
    { name: "Vitamin B12", amount: "250 µg", function: "Supports nerve and muscle function" },
    { name: "Vitamin C", amount: "125 mg", function: "Strengthens collagen and tissue repair" },
    { name: "Magnesium", amount: "125 mg", function: "Promotes muscle relaxation and flexibility" },
    { name: "Omega-3", amount: "250 mg", function: "Reduces inflammation and supports joints" },
  ];

  const defaultTestimonials = [
    { quote: "I spend long hours at a desk, and my back used to ache constantly. After a few weeks, my posture feels stronger and I have more energy.", name: "Lina R.", rating: 5, avatar: "" },
    { quote: "You can actually feel the difference—better flexibility, less stiffness. It has become an essential part of my routine.", name: "Daniel S.", rating: 5, avatar: "" },
    { quote: "I've struggled with lower back stiffness for years, but after a month I feel noticeably more flexible and comfortable.", name: "Thomas L.", rating: 5, avatar: "" }
  ];

  const defaultFAQs = [
    { question: "How long until I notice results?", answer: "Most customers feel improvements in posture, flexibility, or energy within 3–4 weeks of consistent use." },
    { question: "Can I take it with other supplements?", answer: "Yes, our formula is designed to complement most daily regimens. Please consult your healthcare provider if you have specific concerns." },
    { question: "Is it suitable for vegetarians?", answer: "Yes, our capsules use plant-based ingredients." },
    { question: "Where is it made?", answer: "All our products are manufactured in Germany under strict GMP standards." }
  ];

  const defaultWhyChoose = {
    title: "Why Choose Vlyora Core?",
    bullets: [
      "Supports bone and spinal strength",
      "Promotes better posture and flexibility",
      "Reduces inflammation and stiffness",
      "Boosts daily energy and vitality",
      "Enhances recovery from stress and strain",
    ],
    imagePosition: "right" as const,
  };

  const defaultHowToUse = {
    title: "How to Use",
    content: "Take 2 capsules daily with a glass of water, preferably with a meal. Each bottle contains 60 capsules, providing a full 30 day supply.",
    imagePosition: "left" as const,
  };

  const whyChoose = parseJson(product.metadata?.marketing_why_choose, defaultWhyChoose);
  const howToUse = parseJson(product.metadata?.marketing_how_to_use, defaultHowToUse);

  // Action Panel Component - powered by unified ProductPurchaseSection
  const ActionPanel = () => (
    <div className="space-y-4 w-full">
      <ProductPurchaseSection product={rawProduct} />
    </div>
  );

  return (
    <div className="min-h-screen bg-background px-4 md:px-32">
      <StickyBottom product={product}>

        <div className="w-full">
          <FadeIn>
            <MarketingHeroV2
              product={product}
              averageRating={averageRating}
              reviewCount={reviewCount}
              actionPanel={<ActionPanel />}
              images={images}
            />
          </FadeIn>
        </div>

        <FadeIn delay={0.1}>
          <ScienceTable
            title="The Science Behind the Strength"
            subtitle="Each capsule combines nature's finest nutrients in clinically balanced doses for optimal spine and back support."
            ingredients={parseJson(product.metadata?.ingredients, defaultIngredients)}
          />
        </FadeIn>

        <FadeIn delay={0.1}>
          <SplitFeatureSection
            title={whyChoose.title ?? defaultWhyChoose.title}
            bullets={whyChoose.bullets}
            imageSrc={whyChoose.imageSrc || images[0] || "/placeholder.jpg"}
            imagePosition={whyChoose.imagePosition ?? "right"}
          />
        </FadeIn>

        <FadeIn delay={0.1}>
          <SplitFeatureSection
            title={howToUse.title ?? defaultHowToUse.title}
            content={howToUse.content}
            imageSrc={howToUse.imageSrc || images[1] || images[0] || "/placeholder.jpg"}
            imagePosition={howToUse.imagePosition ?? "left"}
          />
        </FadeIn>

        <FadeIn delay={0.1}>
          <TestimonialCarousel
            title="Chosen by Those Who Prioritize Inner Strength"
            testimonials={defaultTestimonials}
          />
        </FadeIn>

        <FadeIn delay={0.1}>
          <FAQAccordion
            title="Frequently Asked Questions"
            faqs={defaultFAQs}
          />
        </FadeIn>

        {/* E-Commerce Standard Content */}
        <div className="w-full py-8 space-y-10">
          <div className="space-y-6">
            <CardAnyText className="m-0 py-2" title="Product Description" defaultOpen>
              <Markdown source={product.description || ""} />
            </CardAnyText>
            {(product.nutrition ?? product.metadata?.nutrition) && (
              <CardAnyText className="m-0 py-2" title="Product Information">
                <MarkdownNutrition source={product.nutrition ?? product.metadata?.nutrition ?? ""} />
              </CardAnyText>
            )}
          </div>

          {bundleProducts.length > 0 && (
            <div className="space-y-6">
              <h2 className="text-3xl font-serif">Bundle Offers</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {bundleProducts.map((bundle) => (
                  <PackCardNew key={bundle.id} product={bundle} />
                ))}
              </div>
            </div>
          )}

          {relatedProducts.length > 0 && (
            <div className="space-y-6">
              <h2 className="text-3xl font-serif">You May Also Like</h2>
              <RelatedProductsClient products={relatedProducts} />
            </div>
          )}

          <div id="reviews" className="space-y-6 scroll-mt-24">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h2 className="text-3xl font-serif">Customer Reviews</h2>
              <div className="flex items-center gap-2">
                <StarRating rating={averageRating} size="md" />
                <span className="text-sm font-medium text-muted-foreground">
                  ({averageRating.toFixed(1)} / 5 · {reviewCount} {reviewCount === 1 ? 'review' : 'reviews'})
                </span>
              </div>
            </div>
            <ReviewsClient productId={product.id} reviews={reviews} />
          </div>
        </div>

        <FadeIn delay={0.1}>
          <BottomCTA
            title="Support Your Spine from the Inside Out"
            description="Vlyora's Blog brings you practical knowledge to help you live with strength and balance."
            price={defaultPrice || 3299}
            imageSrc={images[0] || "/placeholder.jpg"}
          />
        </FadeIn>

      </StickyBottom>
    </div>
  );
}
