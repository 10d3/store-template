import AddToCartButton from "@/components/shared/add-to-cart-button";
import CarousselVariants from "@/components/shared/caroussel-variants";
import QuantityManagement from "@/components/shared/quantity-management";
import VideoReviewMasonry from "@/components/shared/review-section";
import SelectVariant from "@/components/shared/select-variant";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getProduct } from "@/lib/product/crud";
import { Heart, Share2, Star } from "lucide-react";
import Image from "next/image";
import React from "react";

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

  console.log(params.slug, searchParams);

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

  // Hardcoded grid positioning for masonry layout
  const getGridPosition = (index: number) => {
    const positions = [
      "col-span-2 row-span-2", // First item - large
      "col-span-2 row-span-1", // Second item - wide
      "col-span-1 row-span-1", // Third item - small
      "col-span-1 row-span-1", // Fourth item - small
    ];
    return positions[index] || "col-span-1 row-span-1";
  };

  return (
    <main className="flex flex-col-reverse md:flex-row gap-8 w-full">
      <div className="w-full md:w-4/7 h-1/2 md:h-full">
        <div
          className="grid grid-cols-4 gap-4 h-auto"
          style={{ gridAutoRows: "200px" }}
        >
          {mediaItems.map((item, index) => (
            <div
              key={item.id}
              className={`group overflow-hidden rounded-lg ${getGridPosition(index)}`}
            >
              {item.type === "image" ? (
                <Image
                  width={1000}
                  height={1000}
                  className="w-full h-full object-cover transition-all duration-700 group-hover:scale-105"
                  src={item.src}
                  alt={item.alt}
                />
              ) : (
                <div className="relative w-full h-full">
                  <Image
                    width={1000}
                    height={1000}
                    className="w-full h-full object-cover transition-all duration-700 group-hover:scale-105"
                    src={item.thumbnail || item.src}
                    alt={item.alt}
                  />
                  {/* Video Play Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-all duration-300">
                    <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center">
                      <svg
                        className="w-5 h-5 text-gray-800 ml-0.5"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                  </div>
                  {/* Title overlay for videos */}
                  {item.title && (
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                      <p className="text-white text-sm font-medium">
                        {item.title}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
        <div>description</div>
        <div>
          <ScrollArea>
            <VideoReviewMasonry />
          </ScrollArea>
        </div>
      </div>
      <div className="w-full md:w-3/7 h-1/2 md:h-full gap-4 flex flex-col">
        <div>
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
                  <Button variant="ghost" size="icon" className="rounded-full">
                        <Heart className="w-5 h-5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="rounded-full">
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
                  <span className="text-sm text-muted-foreground">156 reviews</span>
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
        </div>
        <div>
          <AddToCartButton product={selectedVariant} />
        </div>
        <div>
          <div>{/*placeholder for pack maker if available*/}</div>
          <ScrollArea>
            {/*placeholder for pack that this product is part of*/}
          </ScrollArea>
        </div>
      </div>
    </main>
  );
}
