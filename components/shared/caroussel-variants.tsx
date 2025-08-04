"use client";
import { StripeProduct } from "@/types/product";
import React, { useEffect, useState } from "react";
import {
  Carousel,
  CarouselApi,
  CarouselContent,
  CarouselItem,
} from "../ui/carousel";
import { Button } from "../ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";

export default function CarousselVariants({
  products,
}: {
  products: StripeProduct[];
}) {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState<number>(0);

  useEffect(() => {
    if (!api) return;
    setApi(api);
    api.on("select", () => {
      const newIndex = api.selectedScrollSnap();
      setCurrent(newIndex);
    });
  }, [api]);

  return (
    <Carousel className="w-full" setApi={setApi}>
      <CarouselContent className="grid grid-cols-3 gap-4 h-auto">
        {products.map((product) => (
          <CarouselItem key={product.id}>
            <div className="group overflow-hidden rounded-lg">
              <div className="relative w-full h-full">
                <Image
                  width={1000}
                  height={1000}
                  className="w-full h-full object-cover transition-all duration-700 group-hover:scale-105"
                  src={product.images?.[0] || ""}
                  alt={product.name}
                />
              </div>
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      <div className="absolute top-1/2 left-0 transform -translate-y-1/2">
        <Button
          className="cursor-pointer rounded-full"
          onClick={() => api?.scrollTo(current - 1)}
        >
          <ChevronLeft />
        </Button>
      </div>
      <div className="absolute top-1/2 right-0 transform -translate-y-1/2">
        <Button
          className="cursor-pointer rounded-full"
          onClick={() => api?.scrollTo(current + 1)}
        >
          <ChevronRight />
        </Button>
      </div>
    </Carousel>
  );
}
