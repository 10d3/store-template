"use client";
import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";

interface MediaProductGalleryProps {
  images: string[];
  className?: string;
}

export default function MediaProductGallery({
  images,
  className,
}: MediaProductGalleryProps) {
  const [selectedImage, setSelectedImage] = useState(images[0]);

  return (
    <div
      className={cn(
        "w-full flex flex-col-reverse md:flex-row gap-4 md:max-h-[48rem]",
        className
      )}
    >
      {/* Main Image */}
      <Card className="relative aspect-square overflow-hidden rounded-lg bg-background md:flex-1 order-2 md:order-1">
        <Image
          src={selectedImage}
          alt="Product image"
          fill
          className=" object-cover"
          priority
        />
      </Card>

      {/* Thumbnail Navigation */}
      <div className="flex flex-row md:flex-col gap-2 md:gap-4 md:w-24 lg:w-32 order-1 md:order-2 overflow-x-auto md:overflow-y-auto md:max-h-[48rem] pb-2 md:pb-0 items-center justify-center">
        {images.map((image, index) => (
          <Card
            key={index}
            className={cn(
              "relative aspect-square cursor-pointer overflow-hidden rounded-lg bg-background transition-all flex-shrink-0 w-16 h-16 md:w-full md:h-auto",
              //   selectedImage === image && "ring-2 ring-primary"
            )}
            onClick={() => setSelectedImage(image)}
          >
            <Image
              src={image}
              alt={`Product thumbnail ${index + 1}`}
              fill
              className="object-cover"
            />
          </Card>
        ))}
      </div>
    </div>
  );
}
