/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";
import * as React from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getTranslations } from "@/i18n/server";

interface ProductCardProps {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  image: string;
  hoverMedia?: {
    type: "image" | "video";
    src: string;
  };
  className?: string;
  onAddToCart?: (productId: string) => void;
}

export function ProductCard({
  id,
  name,
  price,
  originalPrice,
  discount,
  image,
  hoverMedia,
  className,
  onAddToCart,
  ...props
}: ProductCardProps) {
  // const t = useTranslations("home");
  const [isHovered, setIsHovered] = React.useState(false);
  const [mediaLoaded, setMediaLoaded] = React.useState(false);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(price);
  };

  const handleAddToCart = () => {
    onAddToCart?.(id);
  };

  // console.log("translations", t)

  return (
    <Card
      className={cn(
        "group relative overflow-hidden border-0 shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer bg-white m-0 p-0",
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      {...props}
    >
      {/* Discount Badge */}
      {discount && (
        <Badge
          variant="destructive"
          className="absolute top-3 right-3 z-20 bg-red-500 text-white font-semibold px-2 py-1 text-xs rounded-full"
        >
          {/* {discount}% {t("discount")} */}
        </Badge>
      )}

      <CardContent className="p-0 m-0 relative">
        {/* Image Container - Full Card */}
        <div className="relative aspect-square overflow-hidden bg-gray-50">
          {/* Main Image */}
          <Image
            src={image || "/placeholder.svg"}
            alt={name}
            fill
            className={cn(
              "object-cover transition-all duration-500 ease-in-out",
              isHovered && hoverMedia
                ? "opacity-0 scale-105"
                : "opacity-100 scale-100"
            )}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />

          {/* Hover Media */}
          {hoverMedia && (
            <div
              className={cn(
                "absolute inset-0 transition-all duration-500 ease-in-out",
                isHovered ? "opacity-100 scale-100" : "opacity-0 scale-105"
              )}
            >
              {hoverMedia.type === "video" ? (
                <video
                  src={hoverMedia.src}
                  autoPlay
                  muted
                  loop
                  playsInline
                  className="w-full h-full object-cover"
                  onLoadedData={() => setMediaLoaded(true)}
                />
              ) : (
                <Image
                  src={hoverMedia.src || "/placeholder.svg"}
                  alt={`${name}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  onLoad={() => setMediaLoaded(true)}
                />
              )}
            </div>
          )}

          {/* Overlay Gradient for better text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

          {/* Product Title - Show on hover */}
          <div
            className={cn(
              "absolute bottom-4 left-4 transition-all duration-300 ease-in-out z-10"
              // isHovered
              //   ? "opacity-100 translate-y-0"
              //   : "opacity-0 -translate-y-2"
            )}
          >
            <h2 className=" font-semibold text-white line-clamp-2 leading-tight drop-shadow-lg">
              {name}
            </h2>
          </div>

          {/* Quick Add Button - appears on hover */}
          {/* <div
            className={cn(
              "absolute inset-x-4 bottom-16 transition-all duration-300 ease-in-out z-10",
              isHovered
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-4"
            )}
          >
            <Button
              onClick={handleAddToCart}
              className="w-full bg-white text-black hover:bg-gray-100 transition-colors duration-200 font-medium"
              size="sm"
            >
              test
            </Button>
          </div> */}

          {/* Price - Always visible at bottom */}
          <div className="absolute bottom-4 right-4 z-10">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-lg text-white drop-shadow-lg">
                {formatPrice(price)}
              </span>
              {originalPrice && originalPrice > price && (
                <span className="text-sm text-white/80 line-through drop-shadow-lg">
                  {formatPrice(originalPrice)}
                </span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default ProductCard;
