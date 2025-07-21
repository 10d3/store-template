import { cn } from "@/lib/utils";
import Image from "next/image";
import * as React from "react";
import { Card, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";
import { useTranslations } from "next-intl";
import { Button } from "../ui/button";
import { Plus } from "lucide-react";

export default function PackCard() {
  const t = useTranslations();
  const pack = [
    {
      id: "1",
      name: "PROZIS Creatine Creapure - Orange Flavor with Sweeteners",
      price: 24.49,
      originalPrice: 34.99,
      discount: 30,
      image:
        "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=400&fit=crop&crop=center",
      hoverMedia: {
        type: "image" as const,
        src: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=400&fit=crop&crop=center&sat=-100",
      },
    },
    {
      id: "2",
      name: "Whey Protein Isolate - Vanilla Flavor",
      price: 45.99,
      originalPrice: 59.99,
      discount: 25,
      image:
        "https://images.unsplash.com/photo-1593095948071-474c5cc2989d?w=400&h=400&fit=crop&crop=center",
      hoverMedia: {
        type: "image" as const,
        src: "https://images.unsplash.com/photo-1593095948071-474c5cc2989d?w=400&h=400&fit=crop&crop=center&brightness=1.2",
      },
    },
  ];

  // Compute the maximum discount among products
  const maxDiscount = Math.max(...pack.map((product) => product.discount ?? 0));

  return (
    <Card className="m-0 p-0 bg-card relative group ">
      {maxDiscount > 0 && (
        <Badge
          variant="destructive"
          className="absolute top-3 right-3 z-20 bg-red-500 text-white font-semibold px-2 py-1 text-xs rounded-full"
        >
          {maxDiscount}% {t("product.discount")}
        </Badge>
      )}
      <CardContent className=" m-0 p-0 relative grid grid-cols-2 gap-2 bg-black rounded-lg">
        {pack.map((product) => (
          <div
            key={product.id}
            className="relative aspect-square overflow-hidden bg-gray-50 first:rounded-l-lg last:rounded-r-lg"
          >
            {/* Main Image */}
            <Image
              src={product.image || "/placeholder.svg"}
              alt={product.name}
              fill
              className={cn(
                "object-cover transition-all duration-500 ease-in-out opacity-100 scale-100 hover:scale-105"
              )}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          </div>
        ))}
        <div className="absolute inset-0 flex items-center justify-center">
          <Button
            variant="default"
            className="rounded-full w-12 h-12 flex items-center justify-center"
          >
            <Plus size={16} className="text-blue-600" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
