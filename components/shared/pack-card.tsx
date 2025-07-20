"use client";
import * as React from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface PackProduct {
  name: string;
  description: string;
  image: string;
}

interface PackCardProps {
  id: string;
  name: string;
  products: PackProduct[];
  price: number;
  originalPrice?: number;
  discount?: number;
  normalImage: string;
  hoverImage: string;
  className?: string;
  onAddToCart?: (packId: string) => void;
}

export function PackCard({
  id,
  name,
  products,
  price,
  originalPrice,
  discount,
  normalImage,
  hoverImage,
  className,
  onAddToCart,
  ...props
}: PackCardProps) {
  const t = useTranslations();
  const [isHovered, setIsHovered] = React.useState(false);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: "EUR",
    }).format(price);
  };

  const handleAddToCart = () => {
    onAddToCart?.(id);
  };

  return (
    <Card
      className={cn(
        "group relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer bg-gradient-to-br from-gray-100 to-gray-200",
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      {...props}
    >
      {/* Pack Label */}
      <div className="absolute top-4 left-4 z-20">
        <span className="bg-black text-white px-3 py-1 text-sm font-bold tracking-wider">
          {name}
        </span>
      </div>

      {/* Discount Badge */}
      {discount && (
        <Badge
          variant="secondary"
          className="absolute top-4 right-4 z-20 bg-gray-700 text-white font-bold px-3 py-2 text-sm rounded-full flex items-center gap-1"
        >
          <span className="text-lg">🏷️</span>
          {discount}% DE DESCUENTO
        </Badge>
      )}

      <CardContent className="p-0 m-0 relative">
        {/* Main Pack Image Container */}
        <div className="relative aspect-[2/1] overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200">
          {/* Normal State Image */}
          <Image
            src={normalImage || "/placeholder.svg"}
            alt={`${name} pack`}
            fill
            className={cn(
              "object-cover transition-all duration-500 ease-in-out",
              isHovered ? "opacity-0 scale-105" : "opacity-100 scale-100"
            )}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />

          {/* Hover State Image */}
          <Image
            src={hoverImage || "/placeholder.svg"}
            alt={`${name} pack hover`}
            fill
            className={cn(
              "object-cover transition-all duration-500 ease-in-out",
              isHovered ? "opacity-100 scale-100" : "opacity-0 scale-105"
            )}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />

          {/* Product Information Overlay */}
          <div className="absolute inset-0 flex items-center justify-between p-6">
            {/* Left Side - Product List */}
            <div className="flex-1 space-y-2">
              {products.map((product, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                  <span className="text-white font-medium text-lg drop-shadow-lg">
                    {product.name} {product.description}
                  </span>
                </div>
              ))}
            </div>

            {/* Center - Plus Icon */}
            <div className="mx-8">
              <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center">
                <Plus className="w-6 h-6 text-white" />
              </div>
            </div>

            {/* Right Side - Pricing */}
            <div className="flex-1 flex flex-col items-end space-y-1">
              {originalPrice && originalPrice > price && (
                <span className="text-white/80 text-xl line-through drop-shadow-lg">
                  {formatPrice(originalPrice)}
                </span>
              )}
              <span className="text-white font-bold text-3xl drop-shadow-lg">
                {formatPrice(price)}
              </span>
            </div>
          </div>

          {/* Add to Cart Button - appears on hover */}
          <div
            className={cn(
              "absolute inset-x-6 bottom-6 transition-all duration-300 ease-in-out z-10",
              isHovered
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-4"
            )}
          >
            <Button
              onClick={handleAddToCart}
              className="w-full bg-black text-white hover:bg-gray-800 transition-colors duration-200 font-bold py-3 text-lg"
              size="lg"
            >
              {t("product.addToCart")}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default PackCard;
