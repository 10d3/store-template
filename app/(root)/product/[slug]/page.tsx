import AddToCartButton from "@/components/shared/add-to-cart-button";
import CarousselVariants from "@/components/shared/caroussel-variants";
import QuantityManagement from "@/components/shared/quantity-management";
// import VideoReviewMasonry from "@/components/shared/review-section";
import SelectVariant from "@/components/shared/select-variant";
import {
  Card,
  CardContent,
  CardDescription,
  // CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
// import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
// import {
//   getPack,
//   getRelatedProducts,
// } from "@/lib/product/crud";
import { transformPacksToProductData } from "@/lib/product/cache";
import { Share2 } from "lucide-react";
import { getBaseURL } from "@/lib/utils";
// import RelatedProducts from "@/components/shared/related-products";
import { Button } from "@/components/ui/button";
// import MediaGallery from "@/components/shared/media-gallery";
import { PackCardNew } from "@/components/shared/product/product-card";
// import { transformPacksToProductData } from "@/lib/product/pack-transformer";
import WishlistButton from "@/components/shared/wishlist-button";
import MediaProductGallery from "@/components/shared/media-product-gallery";
import { Markdown } from "@/components/shared/markdown";
import CardAnyText from "@/components/shared/card-any-text";
import { MarkdownNutrition } from "@/components/shared/nutrition-label";
import { StickyBottom } from "@/components/shared/sticky-bottom";
import { getReviewsByProductId, getAverageRating } from "@/lib/review/crud";
import StarRating from "@/components/shared/star-rating";
// import ReviewList from "@/components/shared/review-list";
// import ReviewSection from "@/components/shared/review-section-wrapper";
import type { Metadata } from "next";
import BuyNowButton from "@/components/shared/buy-now-button";
import BadgeTrust from "@/components/shared/badge";
import ReviewsClient from "@/components/shared/review-client";
import RelatedProductsClient from "@/components/shared/related-product-client";
import { getPack } from "@/lib/product/bundle-index";
import { getRelatedProducts } from "@/lib/product/related-index";
import { getCachedProduct } from "@/lib/product/test-index-product";
import { StripeProduct } from "@/types/product";

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
  const variants = await getCachedProduct(params.slug);

  if (!variants || variants.length === 0) {
    return {
      title: "Product Not Found",
    };
  }

  const product = variants[0];
  const seoTitle = product.metadata?.seo_title || product.name;

  // Strip markdown from description
  const rawDescription = product.metadata?.seo_description || product.description || `Shop ${product.name} at our store`;
  const seoDescription = stripMarkdown(rawDescription).slice(0, 180);

  // Get product image
  const productImage = product.images?.[0] || "";

  // Get tags from metadata
  const tags = product.metadata?.tags?.split(',').map((t: string) => t.trim()) || [];

  // Get price
  const price = typeof product.default_price === "object" && product.default_price?.unit_amount
    ? `$${(product.default_price.unit_amount / 100).toFixed(2)}`
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

// interface MediaItem {
//   id: string;
//   type: "image" | "video";
//   src: string;
//   thumbnail?: string;
//   alt: string;
//   title?: string;
// }

export default async function page(props: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ variant?: string; image?: string }>;
}) {
  const params = await props.params;
  const searchParams = await props.searchParams;

  const variants = await getCachedProduct(params.slug);
  // console.log("variant form slug", variants);
  const selectedVariants = variants.filter((variant) =>
    variant.metadata?.variants?.includes(searchParams.variant as string)
  );
  // const selectedVariant = selectedVariants[0];

  let packsPromise: Promise<StripeProduct[]> = Promise.resolve([]);

  if (variants[0].metadata?.packs) {
    packsPromise = getPack(variants[0].id);
  }

  const [relatedProducts, reviews, ratingData, packs] = await Promise.all([
    getRelatedProducts(variants[0].id, 4),
    getReviewsByProductId(variants[0].id),
    getAverageRating(variants[0].id),
    packsPromise, // This is now guaranteed to be a Promise<StripeProduct[]>
  ]);

  // 2. Now 'packs' is always an array, so .length is safe
  const packProductData =
    packs.length > 0 ? await transformPacksToProductData(packs) : [];


  const { average: averageRating, count: reviewCount } = ratingData;

  // console.log("packs from slug", packs);
  // const mediaItems: MediaItem[] = [
  //   {
  //     id: "1",
  //     type: "image",
  //     src: (variants[0]?.images?.[0] as string) || "",
  //     alt: "Product image 1",
  //     title: "Main product view",
  //   },
  //   {
  //     id: "2",
  //     type: "image",
  //     src: (variants[0].images?.[1] as string) || "",
  //     thumbnail: (variants[0].images?.[1] as string) || "",
  //     alt: "Product demo video",
  //     title: "Product demonstration",
  //   },
  //   {
  //     id: "3",
  //     type: "image",
  //     src: (variants[0]?.images?.[2] as string) || "",
  //     alt: "Product image 2",
  //     title: "Detail view",
  //   },
  //   {
  //     id: "4",
  //     type: "image",
  //     src: (variants[0]?.images?.[3] as string) || "",
  //     alt: "Product image 4",
  //     title: "Usage example",
  //   },
  //   {
  //     id: "5",
  //     type: "image",
  //     src: (variants[0]?.images?.[4] as string) || "",
  //     alt: "product image 5",
  //     title: " benefit"
  //   }
  // ];

  const images = variants[0].images?.slice(0, 5) ?? [];

  // const getGridPosition = (index: number) => {
  //   const positions = [
  //     "md:col-span-2 md:row-span-3 col-span-7 row-span-2",
  //     "md:col-span-2 md:row-span-2 col-span-4 row-span-2",
  //     "md:col-span-1 md:row-span-1 col-span-3 row-span-1",
  //     "md:col-span-1 md:row-span-1 col-span-3 row-span-1",
  //   ];
  //   return positions[index] || "col-span-1 row-span-1";
  // };

  return (
    <div className="min-h-screen">
      <StickyBottom product={variants[0]}>
        <div className="grid lg:grid-cols-12 gap-8 lg:gap-12">
          {/* Media Gallery */}
          <div className="lg:col-span-7 space-y-8">
            <div className="relative">
              <MediaProductGallery
                // variant="default"
                // images={mediaItems.map((item) => item.src)}
                images={images}
              // mediaItems={mediaItems}
              // getGridPosition={getGridPosition}
              />
            </div>
            <div className="md:hidden">
              <Card className="border-0 shadow-xl bg-card">
                <CardHeader className="pb-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <Badge variant="secondary" className="w-fit">
                        New Arrival
                      </Badge>
                      <CardTitle className="text-3xl lg:text-4xl font-bold leading-tight">
                        {/* {params.slug
                          .replace(/-/g, " ")
                          .replace(/\b\w/g, (l) => l.toUpperCase())} */}
                        {variants[0].name}
                      </CardTitle>
                    </div>
                    <div className="flex gap-2">
                      <WishlistButton productId={variants[0].id} />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-full"
                      >
                        <Share2 className="w-5 h-5" />
                      </Button>
                    </div>
                  </div>
                  {/* <CardDescription className="text-base leading-relaxed line-clamp-3">
                    {variants[0].description}
                  </CardDescription> */}
                  <a href="#reviews" className="flex items-center gap-4 pt-2 cursor-pointer hover:opacity-80 transition-opacity">
                    <StarRating rating={averageRating} size="sm" />
                    <span className="text-sm text-muted-foreground">
                      {reviewCount} {reviewCount === 1 ? 'review' : 'reviews'}
                    </span>
                  </a>
                  <CardDescription className="text-base font-semibold">
                    {variants[0].subtitle}
                  </CardDescription>
                  <Badge variant="secondary" className="w-fit">
                    {variants[0].tagline}
                  </Badge>
                </CardHeader>

                <CardContent className="space-y-6">
                  <div className="flex items-center gap-4">
                    {selectedVariants.length > 1 && (
                      <div className="flex-1">
                        <SelectVariant variants={selectedVariants} />
                      </div>
                    )}
                    <div className="flex-1">
                      <QuantityManagement product={variants[0]} />
                    </div>
                  </div>
                </CardContent>

                {selectedVariants.length > 1 && (
                  <CardFooter className="pt-0 pb-0">
                    <div className="w-full space-y-4">
                      <CarousselVariants products={variants} />
                    </div>
                  </CardFooter>
                )}
              </Card>
            </div>
            <div className="mt-6 md:hidden grid gap-2">
              <BuyNowButton product={variants[0]} />
              <AddToCartButton product={variants[0]} />
            </div>
            <BadgeTrust className="md:hidden" />

            {/* Product Description */}
            <div className="space-y-6">
              <div className="prose prose-gray max-w-none flex flex-col gap-4">
                {/* <h2 className="text-2xl font-semibold mb-4">Description</h2> */}
                <div className="prose text-secondary-foreground">
                  <CardAnyText className="m-0 py-2" title="Product Description">
                    <Markdown source={variants[0].description || ""} />
                  </CardAnyText>
                </div>
                {variants[0].metadata.nutrition && (
                  <div>
                    <CardAnyText className="m-0 py-2" title="Product Information">
                      <MarkdownNutrition
                        source={variants[0].metadata.nutrition}
                      />
                    </CardAnyText>
                  </div>
                )}
              </div>

              {relatedProducts.length > 0 && <Separator className="my-8" />}

              {/* Related Products Section */}
              {relatedProducts.length > 0 && (
                <div className="space-y-4">
                  <h2 className="text-2xl font-semibold">You May Also Like</h2>
                  {/* <RelatedProducts
                    products={relatedProducts}
                    title=""
                    className="py-0"
                  /> */}
                  <RelatedProductsClient products={relatedProducts} />
                </div>
              )}

              {/* Bundle Offers Section */}
              {packProductData.length > 0 && (
                <>
                  <Separator className="my-8" />
                  <div className="space-y-4">
                    <h2 className="text-2xl font-semibold">Bundle Offers</h2>
                    <p className="text-muted-foreground">Save more when you buy together</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {packProductData.map((packData) => (
                        <PackCardNew
                          key={packData.id}
                          product={packData}
                        />
                      ))}
                    </div>
                  </div>
                </>
              )}

              <Separator className="my-8" />

              {/* Reviews Section */}
              <div id="reviews" className="space-y-6 scroll-mt-24">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-semibold">Customer Reviews</h2>
                  <div className="flex items-center gap-2">
                    <StarRating rating={averageRating} size="md" />
                    <span className="text-sm text-gray-600">
                      ({averageRating.toFixed(1)} out of 5 · {reviewCount} {reviewCount === 1 ? 'review' : 'reviews'})
                    </span>
                  </div>
                </div>

                <ReviewsClient productId={variants[0]?.id as string} reviews={reviews} />

                {/* <ReviewSection productId={variants[0]?.id as string} />

                <ReviewList reviews={reviews} /> */}
              </div>
            </div>
          </div>

          {/* Product Information */}
          <div className="lg:col-span-5 space-y-6">
            <div className="sticky top-20">
              <div className="hidden md:block">
                <Card className="border-0 shadow-xl bg-card">
                  <CardHeader className="pb-6">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <Badge variant="secondary" className="w-fit">
                          New Arrival
                        </Badge>
                        <CardTitle className="text-3xl lg:text-4xl font-bold leading-tight">
                          {/* {params.slug
                          .replace(/-/g, " ")
                          .replace(/\b\w/g, (l) => l.toUpperCase())} */}
                          {variants[0].name}
                        </CardTitle>
                      </div>
                      <div className="flex gap-2">
                        <WishlistButton productId={variants[0].id} />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="rounded-full"
                        >
                          <Share2 className="w-5 h-5" />
                        </Button>
                      </div>
                    </div>
                    {/* <CardDescription className="text-base leading-relaxed line-clamp-3">
                    {variants[0].description}
                  </CardDescription> */}
                    <a href="#reviews" className="flex items-center gap-4 pt-2 cursor-pointer hover:opacity-80 transition-opacity">
                      <StarRating rating={averageRating} size="sm" />
                      <span className="text-sm text-muted-foreground">
                        {reviewCount} {reviewCount === 1 ? 'review' : 'reviews'}
                      </span>
                    </a>
                    <CardDescription className="text-base font-semibold">
                      {variants[0].subtitle}
                    </CardDescription>
                    <Badge variant="secondary" className="w-fit">
                      {variants[0].tagline}
                    </Badge>
                  </CardHeader>

                  <CardContent className="space-y-6">
                    <div className="flex items-center gap-4">
                      {selectedVariants.length > 1 && (
                        <div className="flex-1">
                          <SelectVariant variants={selectedVariants} />
                        </div>
                      )}
                      <div className="flex-1">
                        <QuantityManagement product={variants[0]} />
                      </div>
                    </div>
                  </CardContent>

                  {selectedVariants.length > 1 && (
                    <CardFooter className="pt-0 pb-0">
                      <div className="w-full space-y-4">
                        <CarousselVariants products={variants} />
                      </div>
                    </CardFooter>
                  )}
                </Card>
              </div>

              {/* Add to Cart */}
              <div className="mt-6 hidden md:grid grid-cols-2 gap-4">
                <BuyNowButton product={variants[0]} />
                <AddToCartButton product={variants[0]} />
              </div>
              <BadgeTrust className="hidden md:block" />
            </div>
          </div>
        </div>
      </StickyBottom>
    </div>
  );
}
