import AddToCartButton from "@/components/shared/add-to-cart-button";
import CarousselVariants from "@/components/shared/caroussel-variants";
import QuantityManagement from "@/components/shared/quantity-management";
// import VideoReviewMasonry from "@/components/shared/review-section";
import SelectVariant from "@/components/shared/select-variant";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
// import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  getPack,
  getProduct,
  getProductsByProductIds,
  getRelatedProducts,
} from "@/lib/product/crud";
import { Share2 } from "lucide-react";
import { getBaseURL } from "@/lib/utils";
import RelatedProducts from "@/components/shared/related-products";
import { Button } from "@/components/ui/button";
// import MediaGallery from "@/components/shared/media-gallery";
import PackCard from "@/components/shared/pack-card";
import WishlistButton from "@/components/shared/wishlist-button";
import MediaProductGallery from "@/components/shared/media-product-gallery";
import { Markdown } from "@/components/shared/markdown";
import CardAnyText from "@/components/shared/card-any-text";
import { MarkdownNutrition } from "@/components/shared/nutrition-label";
import { StickyBottom } from "@/components/shared/sticky-bottom";
import { getReviewsByProductId, getAverageRating } from "@/lib/review/crud";
import StarRating from "@/components/shared/star-rating";
import ReviewList from "@/components/shared/review-list";
import ReviewSection from "@/components/shared/review-section-wrapper";
import type { Metadata } from "next";

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
  const variants = await getProduct(params.slug);

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

  // Add tags
  if (tags.length > 0) ogImageUrl += `&tags=${encodeURIComponent(tags.slice(0, 3).join(","))}`;

  console.log("ogImageUrl", ogImageUrl);
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

interface MediaItem {
  id: string;
  type: "image" | "video";
  src: string;
  thumbnail?: string;
  alt: string;
  title?: string;
}

export default async function page(props: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ variant?: string; image?: string }>;
}) {
  const params = await props.params;
  const searchParams = await props.searchParams;

  const variants = await getProduct(params.slug);
  // console.log("variant form slug", variants);
  const selectedVariants = variants.filter((variant) =>
    variant.metadata?.variants?.includes(searchParams.variant as string)
  );
  // const selectedVariant = selectedVariants[0];

  const packs = await getPack(variants[0]?.id as string);

  // Fetch related products
  const relatedProducts = await getRelatedProducts(variants[0]?.id as string, 4);

  // Fetch reviews and average rating
  const reviews = await getReviewsByProductId(variants[0]?.id as string);
  const { average: averageRating, count: reviewCount } = await getAverageRating(variants[0]?.id as string);

  // console.log("packs from slug", packs);
  const mediaItems: MediaItem[] = [
    {
      id: "1",
      type: "image",
      src: (variants[0]?.images?.[0] as string) || "",
      alt: "Product image 1",
      title: "Main product view",
    },
    {
      id: "2",
      type: "image",
      src: (variants[0].images?.[1] as string) || "",
      thumbnail: (variants[0].images?.[1] as string) || "",
      alt: "Product demo video",
      title: "Product demonstration",
    },
    {
      id: "3",
      type: "image",
      src: (variants[0]?.images?.[2] as string) || "",
      alt: "Product image 2",
      title: "Detail view",
    },
    {
      id: "4",
      type: "image",
      src: (variants[0]?.images?.[3] as string) || "",
      alt: "Product image 4",
      title: "Usage example",
    },
    {
      id: "5",
      type: "image",
      src: (variants[0]?.images?.[4] as string) || "",
      alt: "product image 5",
      title: " benefit"
    }
  ];

  // const getGridPosition = (index: number) => {
  //   const positions = [
  //     "md:col-span-2 md:row-span-3 col-span-7 row-span-2",
  //     "md:col-span-2 md:row-span-2 col-span-4 row-span-2",
  //     "md:col-span-1 md:row-span-1 col-span-3 row-span-1",
  //     "md:col-span-1 md:row-span-1 col-span-3 row-span-1",
  //   ];
  //   return positions[index] || "col-span-1 row-span-1";
  // };

  const transformedPacks = await Promise.all(
    packs.map(async (pack) => {
      const packProducts = [];

      // If pack has contents metadata, fetch actual products
      if (pack.metadata?.contents) {
        const contentIds = pack.metadata.contents.split(",");
        try {
          const contentProducts = await getProductsByProductIds(contentIds);

          contentProducts.forEach((contentProduct, index) => {
            const defaultPrice =
              typeof contentProduct.default_price === "object" &&
                contentProduct.default_price
                ? contentProduct.default_price
                : null;

            packProducts.push({
              id: `${pack.id}_${contentProduct.id}`,
              name: contentProduct.name, // Use actual product name
              price: defaultPrice?.unit_amount || 0,
              image:
                contentProduct.images?.[0] ||
                pack.images?.[index] ||
                "/placeholder.svg",
              hoverMedia: contentProduct.images?.[1]
                ? {
                  type: "image" as const,
                  src: contentProduct.images[1],
                }
                : undefined,
              stripePriceId: defaultPrice?.id || contentIds[index]?.trim(),
            });
          });
        } catch (error) {
          console.error("Failed to fetch pack contents:", error);
          // Fallback to placeholder names if fetching fails
          contentIds.forEach((productId, index) => {
            packProducts.push({
              id: `${pack.id}_${index}`,
              name: `Product ${index + 1}`,
              price: Math.floor(Math.random() * 5000) + 1000,
              image: pack.images?.[index] || "/placeholder.svg",
              stripePriceId: productId.trim(),
            });
          });
        }
      } else {
        // Default pack content if no metadata
        const defaultPrice =
          typeof pack.default_price === "object" && pack.default_price
            ? pack.default_price
            : null;

        packProducts.push({
          id: `${pack.id}_1`,
          name: pack.name,
          price: defaultPrice?.unit_amount || 0,
          image: pack.images?.[0] || "/placeholder.svg",
          stripePriceId:
            defaultPrice?.id ||
            (typeof pack.default_price === "string"
              ? pack.default_price
              : undefined),
        });
      }

      return {
        id: pack.id,
        name: pack.name, // Use the pack name directly
        products: packProducts,
        bundleDiscount: pack.metadata?.discount
          ? parseInt(pack.metadata.discount)
          : 0,
      };
    })
  );

  return (
    <div className="min-h-screen">
      <StickyBottom product={variants[0]}>
        <div className="grid lg:grid-cols-12 gap-8 lg:gap-12">
          {/* Media Gallery */}
          <div className="lg:col-span-7 space-y-8">
            <div className="relative">
              <MediaProductGallery
                // variant="default"
                images={mediaItems.map((item) => item.src)}
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
            <div className="mt-6 md:hidden">
              <AddToCartButton product={variants[0]} />
            </div>

            {/* Product Description */}
            <div className="space-y-6">
              <div className="prose prose-gray max-w-none flex flex-col gap-4">
                {/* <h2 className="text-2xl font-semibold mb-4">Description</h2> */}
                <div className="prose text-secondary-foreground">
                  <CardAnyText title="Product Description">
                    <Markdown source={variants[0].description || ""} />
                  </CardAnyText>
                </div>
                {variants[0].metadata.nutrition && (
                  <div>
                    <CardAnyText title="Product Information">
                      <MarkdownNutrition
                        source={variants[0].metadata.nutrition}
                      />
                    </CardAnyText>
                  </div>
                )}
              </div>

              <Separator className="my-8" />

              {/* Related Products Section */}
              {relatedProducts.length > 0 && (
                <div className="space-y-4">
                  <h2 className="text-2xl font-semibold">You May Also Like</h2>
                  <RelatedProducts
                    products={relatedProducts}
                    title=""
                    className="py-0"
                  />
                </div>
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

                <ReviewSection productId={variants[0]?.id as string} />

                <ReviewList reviews={reviews} />
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
              <div className="mt-6 hidden md:block">
                <AddToCartButton product={variants[0]} />
              </div>

              {/* Additional Information */}
              <div className="mt-8 space-y-6">
                <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold text-gray-900">
                      Bundle Offers
                    </CardTitle>
                    <CardDescription>
                      Save more when you buy together
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {packs ? (
                      transformedPacks.map((pack) => (
                        <PackCard
                          key={pack.id}
                          id={pack.id}
                          name={pack.name}
                          products={pack.products}
                          bundleDiscount={pack.bundleDiscount}
                          className="hover:scale-105 transition-transform duration-200"
                        // onAddToCart={()=> console.log("click")}
                        />
                      ))
                    ) : (
                      <div className="text-sm text-gray-600">
                        Bundle deals and pack options will appear here when
                        available.
                      </div>
                    )}
                  </CardContent>
                </Card>

              </div>
            </div>
          </div>
        </div>
      </StickyBottom>
    </div>
  );
}
