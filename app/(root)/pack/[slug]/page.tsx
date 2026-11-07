import MediaProductGallery from "@/components/shared/media-product-gallery";
import { StickyBottom } from "@/components/shared/sticky-bottom";
import { getCachedProduct, getCachedRelatedProducts } from "@/lib/catalog";
import { getAverageRating, getReviewsByProductId } from "@/lib/review/crud";
import {
    Card,
    CardContent,
    // CardDescription,
    // CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
// import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import WishlistButton from "@/components/shared/wishlist-button";
import { Button } from "@/components/ui/button";
import { Share2 } from "lucide-react";
import StarRating from "@/components/shared/star-rating";
// import SelectVariant from "@/components/shared/select-variant";
// import CarousselVariants from "@/components/shared/caroussel-variants";
import BadgeTrust from "@/components/shared/badge";
import CardAnyText from "@/components/shared/card-any-text";
import { Markdown } from "@/components/shared/markdown";
import { MarkdownNutrition } from "@/components/shared/nutrition-label";
import RelatedProductsClient from "@/components/shared/related-product-client";
import ProductPurchaseSection from "@/components/catalog/product-purchase-section";
import ReviewsClient from "@/components/shared/review-client";
import { getBaseURL, stripMarkdown } from "@/lib/utils";
import { Metadata } from "next";

export async function generateMetadata(props: {
    params: Promise<{ slug: string }>;
}): Promise<Metadata> {
    const params = await props.params;
    const product = await getCachedProduct(params.slug);

    if (!product) {
        return {
            title: "Product Not Found",
        };
    }

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
}) {
    const { slug } = await props.params;
    const pack = await getCachedProduct(slug);

    if (!pack) {
        throw new Error("Pack not found")
    }

    const [relatedProducts, reviews, ratingData,] = await Promise.all([
        getCachedRelatedProducts(pack.id, 4),
        getReviewsByProductId(pack.id),
        getAverageRating(pack.id),
    ]);

    const { average: averageRating, count: reviewCount } = ratingData;

    const images = pack.images?.slice(0, 5) ?? [];


    return (
        <div className="min-h-screen">
            <StickyBottom product={pack}>
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
                                                {pack.name}
                                            </CardTitle>
                                        </div>
                                        <div className="flex gap-2">
                                            <WishlistButton productId={pack.id} />
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
                                    <ProductPurchaseSection product={pack} />
                                </CardContent>
                            </Card>
                        </div>
                        <BadgeTrust className="md:hidden" />

                        {/* Product Description */}
                        <div className="space-y-6">
                            <div className="prose prose-gray max-w-none flex flex-col gap-4">
                                {/* <h2 className="text-2xl font-semibold mb-4">Description</h2> */}
                                <div className="prose text-secondary-foreground">
                                    <CardAnyText className="m-0 py-2" title="Product Description">
                                        <Markdown source={pack.description || ""} />
                                    </CardAnyText>
                                </div>
                                {pack.metadata?.nutrition && (
                                    <div>
                                        <CardAnyText className="m-0 py-2" title="Product Information">
                                            <MarkdownNutrition
                                                source={pack.metadata.nutrition}
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
                            {/* {packProductData.length > 0 && (
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
                            )} */}

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

                                <ReviewsClient productId={pack?.id as string} reviews={reviews} />

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
                                                    {pack.name}
                                                </CardTitle>
                                            </div>
                                            <div className="flex gap-2">
                                                <WishlistButton productId={pack.id} />
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
                                        <ProductPurchaseSection product={pack} />
                                    </CardContent>
                                </Card>
                            </div>
                            <BadgeTrust className="hidden md:block" />
                        </div>
                    </div>
                </div>
            </StickyBottom>
        </div>
    )
}