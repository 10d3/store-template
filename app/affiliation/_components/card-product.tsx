import { Card, CardTitle } from "@/components/ui/card";
import Image from "next/image";
import React from "react";

interface CardProductProps {
  productName: string;
  postedAt: string;
  totalClicks: number;
  commissions: number;
  sold: number;
}

export default function CardProduct({
  productName,
  postedAt,
  totalClicks,
  commissions,
  sold,
}: CardProductProps) {
  const artistImage =
    "https://6ay8a7s9vf.ufs.sh/f/XID4kzR81z3Mbq69jKhh8ueHgMXbOJ6TRrNtafvYcBDQ51dV";
  return (
    <Card className="p-3 flex flex-row items-center justify-between">
      <div className="relative h-32 w-32 flex-shrink-0 ">
        <Image
          src={artistImage || "/placeholder.svg"}
          alt={productName}
          width={80}
          height={80}
          className="w-full h-full object-cover shadow-lg rounded-lg"
          crossOrigin="anonymous"
        />
      </div>
      <div className="flex flex-row justify-around items-center flex-1">
        <div className="flex flex-col justify-around gap-6">
          <CardTitle>{productName}</CardTitle>
          <p className="text-sm">
            Posted at: {postedAt}
          </p>
        </div>
        <div className="flex flex-col justify-around gap-6">
          <h3 className="">Total clicks</h3>
          <p className="text-lg font-semibold">{totalClicks}</p>
        </div>
        <div className="flex flex-col justify-around gap-6">
          <h3 className="">Commissions</h3>
          <p className="text-lg font-semibold">${commissions.toFixed(2)}</p>
        </div>
        <div className="flex flex-col justify-around gap-6">
          <h3 className="">Sold</h3>
          <p className="text-lg font-semibold">{sold}</p>
        </div>
      </div>
    </Card>
  );
}
