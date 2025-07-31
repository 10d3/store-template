"use client"
import { StripeProduct } from "@/types/product";
import React, { useEffect, useState } from "react";
import {
  Carousel,
  CarouselApi,
  CarouselContent,
  CarouselItem,
} from "../ui/carousel";
import { Button } from "../ui/button";
import { ArrowLeft, ArrowRight } from "lucide-react";

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
      <CarouselContent>
        {products.map((product) => (
          <CarouselItem key={product.id}>
            {/*placeholder for card variant*/}
            {product.name}
          </CarouselItem>
        ))}
      </CarouselContent>
      <div className="absolute top-1/2 left-0 transform -translate-y-1/2">
        <Button onClick={() => api?.scrollTo(current - 1)}>
          <ArrowLeft />
        </Button>
      </div>
      <div className="absolute top-1/2 right-0 transform -translate-y-1/2">
        <Button onClick={() => api?.scrollTo(current + 1)}>
          <ArrowRight />
        </Button>
      </div>
    </Carousel>
  );
}
