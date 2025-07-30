import VideoReviewMasonry from "@/components/shared/review-section";
// import { getProduct } from "@/lib/product/crud";
import Image from "next/image";
import React from "react";

export default async function page({
  props,
}: {
  props: {
    params: Promise<{ slug: string }>;
    searchParams: Promise<{ variant?: string; image?: string }>;
  };
}) {
  // const params = await props.params;
  // const searchParams = await props.searchParams;

  // console.log(params.slug, searchParams);

  // const variants = await getProduct(params.slug);
  // const selectedVariant = variants;
  // console.log(selectedVariant);
  const images = [
    "https://flowbite.s3.amazonaws.com/docs/gallery/masonry/image.jpg",
    "https://flowbite.s3.amazonaws.com/docs/gallery/masonry/image-1.jpg",
    "https://flowbite.s3.amazonaws.com/docs/gallery/masonry/image-2.jpg",
    "https://flowbite.s3.amazonaws.com/docs/gallery/masonry/image-3.jpg",
  ];

  return (
    <main className="flex flex-col gap-2 w-full">
      <div className="w-full md:w-3/6 h-1/2 md:h-full">
        <div className="grid grid-cols-4 grid-rows-2 gap-4 h-96">
          {/* First photo - spans 2 columns and 2 rows */}
          <div className="col-span-2 row-span-2">
            <Image
              width={1000}
              height={1000}
              className="w-full h-full object-cover rounded-lg"
              src={images[0]}
              alt="Product image 1"
            />
          </div>

          {/* Second photo - spans 1 column and 2 rows */}
          <div className="col-span-2 row-span-1">
            <Image
              width={1000}
              height={1000}
              className="w-full h-full object-cover rounded-lg"
              src={images[1]}
              alt="Product image 2"
            />
          </div>

          {/* Third photo - spans remaining space (top right) */}
          <div className="col-span-1 row-span-1">
            <Image
              width={1000}
              height={1000}
              className="w-full h-full object-cover rounded-lg"
              src={images[2]}
              alt="Product image 3"
            />
          </div>

          {/* Fourth photo - spans remaining space (bottom right) */}
          <div className="col-span-1 row-span-1">
            <Image
              width={1000}
              height={1000}
              className="w-full h-full object-cover rounded-lg"
              src={images[3]}
              alt="Product image 4"
            />
          </div>
        </div>
        <div>description</div>
        <div>
          <VideoReviewMasonry />
        </div>
      </div>
      <div className="w-full md:w-2/6 h-1/2 md:h-full"></div>
    </main>
  );
}
