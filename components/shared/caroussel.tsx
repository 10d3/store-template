"use client";
import React, { useEffect, useState } from "react";
import {
  Carousel,
  CarouselApi,
  CarouselContent,
  CarouselItem,
} from "../ui/carousel";
import VideoPlayer from "./video-player";
import { cn } from "@/lib/utils";
import Image from "next/image";

export default function CarouselComponent({
  className,
}: {
  className?: string;
}) {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (!api) return;
    setCurrent(api.selectedScrollSnap());
    api.on("select", () => {
      setCurrent(api.selectedScrollSnap());
    });
  }, [api]);

  const onEnd = () => {
    if (!api) return;
    setCurrent(api.selectedScrollSnap());
  };

  const items = [
    {
      type: "image",
      src: "/images/image1.jpg",
      alt: "Une belle image",
    },
    {
      type: "video",
      src: "/videos/ma-video.mp4",
      poster: "/images/mon-poster.jpg",
      width: 640,
      height: 360,
    },
    {
      type: "image",
      src: "/images/image2.jpg",
      alt: "Une autre image",
    },
  ];

  return (
    <main className={cn("w-full h-screen relative", className)}>
      <Carousel setApi={setApi}>
        <CarouselContent>
          {items.map((item, i) =>
            item.type === "image" ? (
              <CarouselItem key={i}>
                <Image
                  src={item.src}
                  alt={item.alt as string}
                  width={item.width as number}
                  height={item.height as number}
                />
              </CarouselItem>
            ) : (
              <CarouselItem key={i}>
                <VideoPlayer
                  src={item.src}
                  poster={item.poster as string}
                  width={item.width?.toString() as string}
                  height={item.height?.toString() as string}
                  controls={true}
                  onEnded={() => {
                    onEnd();
                  }}
                />
              </CarouselItem>
            )
          )}
        </CarouselContent>
      </Carousel>
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
        <div className="flex items-center justify-center">
          {items.map((item, i) => (
            <div
              key={i}
              className={cn(
                "size-8 rounded-full mx-1 border-2",
                current === i ? "border-white" : "border-background"
              )}
            >
              <Image
                src={
                  item.type === "image"
                    ? (item.src as string)
                    : (item.poster as string)
                }
                alt={item.alt as string}
                width={item.width as number}
                height={item.height as number}
              />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
