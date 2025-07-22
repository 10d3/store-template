"use client";
import { cn } from "@/lib/utils";
import Image from "next/image";
import * as React from "react";
import { Card, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Plus } from "lucide-react";
import { useCartStore } from "@/lib/store";
import { useTranslations } from "@/i18n/client";

interface PackProduct {
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
  stripePriceId?: string;
}

interface PackCardProps {
  id?: string;
  name?: string;
  products: PackProduct[];
  bundleDiscount?: number;
  className?: string;
  onAddToCart?: (products: PackProduct[]) => void;
}

export default function PackCard({
  id = "pack-bundle",
  name = "BUNDLE PACK",
  products = [],
  bundleDiscount = 0,
  className,
  onAddToCart,
}: PackCardProps) {
  const t = useTranslations("product");
  const currency = useTranslations("common");
  const [isHovered, setIsHovered] = React.useState(false);
  const [hoveredProductId, setHoveredProductId] = React.useState<string | null>(
    null
  );
  const { addBundle, applyCoupon } = useCartStore();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency("currency"),
    }).format(price / 100); // Assuming price is in cents
  };

  // Calculate total prices
  const originalTotal = products.reduce(
    (sum, product) => sum + (product.originalPrice || product.price),
    0
  );
  const currentTotal = products.reduce(
    (sum, product) => sum + product.price,
    0
  );
  const finalTotal =
    bundleDiscount > 0
      ? currentTotal * (1 - bundleDiscount / 100)
      : currentTotal;

  // Get maximum individual discount
  const maxDiscount = Math.max(
    ...products.map((product) => product.discount ?? 0),
    bundleDiscount
  );

  const handleAddToCart = () => {
    if (onAddToCart) {
      onAddToCart(products);
    } else {
      // Default cart behavior
      const bundleItems = products.map((product) => ({
        id: Number.parseInt(product.id),
        name: product.name,
        price: product.price,
        quantity: 1,
        maxQuantity: 99,
        stripePriceId: product.stripePriceId || `price_${product.id}`,
        image: product.image,
      }));

      addBundle(bundleItems);

      if (bundleDiscount > 0) {
        applyCoupon({
          id: `bundle_${id}_${bundleDiscount}`,
          type: "percent",
          value: bundleDiscount,
        });
      }
    }
  };

  if (products.length === 0) {
    return (
      <Card className="m-0 p-0 bg-card relative rounded-lg">
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">No products in this pack</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className={cn(
        "m-0 p-0 bg-card relative group rounded-lg overflow-hidden transition-all duration-300 hover:shadow-lg",
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setHoveredProductId(null);
      }}
    >
      {/* Pack Name Badge */}
      <div className="absolute top-3 left-3 z-30">
        <Badge
          variant="secondary"
          className="bg-black text-white font-bold px-3 py-1 text-xs"
        >
          {name}
        </Badge>
      </div>

      {/* Discount Badge */}
      {maxDiscount > 0 && (
        <Badge
          variant="destructive"
          className="absolute top-3 right-3 z-30 bg-red-500 text-white font-semibold px-3 py-1 text-xs rounded-lg shadow-lg"
        >
          {maxDiscount}% {t("discount")}
        </Badge>
      )}

      <CardContent className="m-0 p-0 relative">
        {/* Products Grid */}
        <div
          className={cn(
            "grid gap-1 rounded-lg",
            products.length === 2 ? "grid-cols-2" : "grid-cols-3"
          )}
        >
          {products.map((product, index) => (
            <div
              key={product.id}
              className={cn(
                "relative aspect-square overflow-hidden transition-all duration-300",
                index === 0 && "rounded-l-lg",
                index === products.length - 1 && "rounded-r-lg",
                hoveredProductId === product.id &&
                  "ring-2 ring-blue-500 ring-offset-2"
              )}
              onMouseEnter={() => setHoveredProductId(product.id)}
              onMouseLeave={() => setHoveredProductId(null)}
            >
              {/* Main Product Image */}
              <Image
                src={product.image || "/placeholder.svg"}
                alt={product.name}
                fill
                className={cn(
                  "object-cover transition-all duration-500 ease-in-out",
                  hoveredProductId === product.id && product.hoverMedia
                    ? "opacity-0 scale-105"
                    : "opacity-100 scale-100",
                  isHovered && "scale-105"
                )}
                sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
              />

              {/* Hover Media */}
              {product.hoverMedia && (
                <div
                  className={cn(
                    "absolute inset-0 transition-all duration-500 ease-in-out",
                    hoveredProductId === product.id
                      ? "opacity-100 scale-100"
                      : "opacity-0 scale-105"
                  )}
                >
                  {product.hoverMedia.type === "video" ? (
                    <video
                      src={product.hoverMedia.src}
                      autoPlay
                      muted
                      loop
                      playsInline
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Image
                      src={product.hoverMedia.src || "/placeholder.svg"}
                      alt={`${product.name} - hover ${t("hoverImageAlt")}`}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                    />
                  )}
                </div>
              )}

              {/* Product Info Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

              {/* Product Name */}
              <div className="absolute bottom-2 left-2 right-2">
                <h3 className="text-white text-xs font-medium drop-shadow-lg line-clamp-1">
                  {product.name}
                </h3>
                {product.originalPrice &&
                  product.originalPrice > product.price && (
                    <div className="flex items-center gap-1 mt-1">
                      <span className="text-white/80 text-xs line-through">
                        {formatPrice(product.originalPrice)}
                      </span>
                      <span className="text-white text-xs font-bold">
                        {formatPrice(product.price)}
                      </span>
                    </div>
                  )}
              </div>

              {/* Individual Product Discount */}
              {product.discount && product.discount > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute top-2 right-2 bg-red-500 text-white text-xs px-1 py-0.5"
                >
                  -{product.discount}%
                </Badge>
              )}
            </div>
          ))}
        </div>

        {/* Center Action Button */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div
            className={cn(
              "transition-all duration-300 ease-in-out pointer-events-auto",
              isHovered ? "scale-110" : "scale-100"
            )}
          >
            <Button
              onClick={handleAddToCart}
              variant="default"
              size="lg"
              className={cn(
                "rounded-full w-14 h-14 flex flex-col items-center justify-center gap-1 shadow-lg transition-all duration-300",
                "bg-white text-black hover:bg-gray-100 border-2 border-gray-200",
                isHovered && "shadow-xl scale-105"
              )}
            >
              <Plus size={20} className="text-blue-600" />
              <span className="text-xs font-bold">
                {formatPrice(finalTotal)}
              </span>
            </Button>
          </div>
        </div>

        {/* Savings Information */}
        {originalTotal > finalTotal && (
          <div
            className={cn(
              "absolute bottom-3 left-3 right-3 text-center transition-all duration-300",
              isHovered
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-2"
            )}
          >
            <div className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold inline-block">
              Save {formatPrice(originalTotal - finalTotal)}
            </div>
          </div>
        )}

        {/* Add to Cart Button - Full Width on Hover */}
        {/* <div
          className={cn(
            "absolute inset-x-3 bottom-3 transition-all duration-300 ease-in-out",
            isHovered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4",
          )}
        >
          <Button
            onClick={handleAddToCart}
            className="w-full bg-black text-white hover:bg-gray-800 transition-colors duration-200 font-bold"
            size="sm"
          >
            <ShoppingCart className="w-4 h-4 mr-2" />
            {t("product.addToCart")}
          </Button>
        </div> */}
      </CardContent>
    </Card>
  );
}
