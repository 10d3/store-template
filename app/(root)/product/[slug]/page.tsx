import AddToCartButton from "@/components/shared/add-to-cart-button";
import CarousselVariants from "@/components/shared/caroussel-variants";
import QuantityManagement from "@/components/shared/quantity-management";
import VideoReviewMasonry from "@/components/shared/review-section";
import SelectVariant from "@/components/shared/select-variant";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { getProduct } from "@/lib/product/crud";
import { Star, Heart, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import MediaGallery from "@/components/shared/media-gallery";

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
  const selectedVariants = variants.filter((variant) =>
    variant.metadata?.variants?.includes(searchParams.variant as string)
  );
  const selectedVariant = selectedVariants[0];

  const mediaItems: MediaItem[] = [
    {
      id: "1",
      type: "image",
      src: "https://flowbite.s3.amazonaws.com/docs/gallery/masonry/image.jpg",
      alt: "Product image 1",
      title: "Main product view",
    },
    {
      id: "2",
      type: "video",
      src: "/placeholder-video.mp4",
      thumbnail:
        "https://flowbite.s3.amazonaws.com/docs/gallery/masonry/image-2.jpg",
      alt: "Product demo video",
      title: "Product demonstration",
    },
    {
      id: "3",
      type: "image",
      src: "https://flowbite.s3.amazonaws.com/docs/gallery/masonry/image-1.jpg",
      alt: "Product image 2",
      title: "Detail view",
    },
    {
      id: "4",
      type: "image",
      src: "https://flowbite.s3.amazonaws.com/docs/gallery/masonry/image-3.jpg",
      alt: "Product image 4",
      title: "Usage example",
    },
  ];

  const getGridPosition = (index: number) => {
    const positions = [
      "md:col-span-2 md:row-span-3 col-span-7 row-span-2",
      "md:col-span-2 md:row-span-2 col-span-4 row-span-2",
      "md:col-span-1 md:row-span-1 col-span-3 row-span-1",
      "md:col-span-1 md:row-span-1 col-span-3 row-span-1",
    ];
    return positions[index] || "col-span-1 row-span-1";
  };

  return (
    <div className="min-h-screen">
      <div className="">
        <div className="grid lg:grid-cols-12 gap-8 lg:gap-12">
          {/* Media Gallery */}
          <div className="lg:col-span-7 space-y-8">
            <div className="relative">
              <MediaGallery
                variant="default"
                mediaItems={mediaItems}
                getGridPosition={getGridPosition}
              />
            </div>

            {/* Product Description */}
            <div className="space-y-6">
              <div className="prose prose-gray max-w-none">
                <h2 className="text-2xl font-semibold mb-4">Description</h2>
                <p className="leading-relaxed">
                  Experience the perfect blend of style and functionality with
                  this carefully crafted product. Designed with attention to
                  detail and built to last, it represents the pinnacle of modern
                  design philosophy.
                </p>
              </div>

              <Separator className="my-8" />

              {/* Reviews Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-semibold">Customer Reviews</h2>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${i < 4 ? "text-yellow-400 fill-current" : "text-gray-300"}`}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-gray-600">
                      (4.2 out of 5)
                    </span>
                  </div>
                </div>
                <ScrollArea className="">
                  <VideoReviewMasonry />
                </ScrollArea>
              </div>
            </div>
          </div>

          {/* Product Information */}
          <div className="lg:col-span-5 space-y-6">
            <div className="sticky top-20">
              <Card className="border-0 shadow-xl bg-card">
                <CardHeader className="pb-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <Badge variant="secondary" className="w-fit">
                        New Arrival
                      </Badge>
                      <CardTitle className="text-3xl lg:text-4xl font-bold leading-tight">
                        {params.slug
                          .replace(/-/g, " ")
                          .replace(/\b\w/g, (l) => l.toUpperCase())}
                      </CardTitle>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-full"
                      >
                        <Heart className="w-5 h-5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-full"
                      >
                        <Share2 className="w-5 h-5" />
                      </Button>
                    </div>
                  </div>
                  <CardDescription className="text-base leading-relaxed">
                    Premium quality product designed for the modern lifestyle.
                    Crafted with precision and attention to detail.
                  </CardDescription>
                  <div className="flex items-center gap-4 pt-2">
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${i < 4 ? "text-yellow-400 fill-current" : "text-muted-foreground"}`}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-muted-foreground">
                      156 reviews
                    </span>
                  </div>
                </CardHeader>

                <CardContent className="space-y-6">
                  <div className="flex items-center gap-4">
                    {selectedVariants.length > 1 && (
                      <div className="flex-1">
                        <SelectVariant variants={selectedVariants} />
                      </div>
                    )}
                    <div className="flex-1">
                      <QuantityManagement product={selectedVariant} />
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="pt-0 pb-0">
                  <div className="w-full space-y-4">
                    <CarousselVariants products={variants} />
                  </div>
                </CardFooter>
              </Card>

              {/* Add to Cart */}
              <div className="mt-6">
                <AddToCartButton product={selectedVariant} />
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
                    <div className="text-sm text-gray-600">
                      Bundle deals and pack options will appear here when
                      available.
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-50">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold text-gray-900">
                      Product Collections
                    </CardTitle>
                    <CardDescription>
                      Part of curated collections
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-32">
                      <div className="text-sm text-gray-600">
                        Collections and related product packs will be displayed
                        here.
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
