import { Badge } from "@/components/ui/badge"
import Image from "next/image"

interface ProductImageProps {
  src: string
  alt: string
  savings: number
}

export function ProductImage({ src, alt, savings }: ProductImageProps) {
  // Fallback to placeholder if src is empty or undefined
  const imageSrc = src && src.length > 0 ? src : "/placeholder.svg"

  return (
    <div className="relative mb-4 flex justify-center w-2/3 rounded-xl">
      <Image
        width={1000}
        height={1000}
        src={imageSrc}
        alt={alt}
        className="w-full h-auto object-contain rounded-xl"
      />
      <Badge
        variant="secondary"
        className="absolute -top-2 right-8 bg-foreground text-background hover:bg-foreground/90 font-medium rounded-xl"
      >
        {savings}% OFF
      </Badge>
    </div>
  )
}
