import Image from "next/image";
import Link from "next/link";
import type { ProductCardData } from "@/lib/catalog/queries";
import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils";
import { StarRating } from "@/components/store/star-rating";

export function ProductCard({ product }: { product: ProductCardData }) {
  const image = product.images[0]?.url;
  const prices = product.variants.map((variant) => variant.price);
  const price = prices.length > 0 ? Math.min(...prices) : 0;
  const compareAt = product.variants[0]?.compareAtPrice;
  const soldOut =
    product.variants.length === 0 ||
    product.variants.every(
      (variant) => variant.trackInventory && variant.stock <= 0
    );

  return (
    <Link
      href={`/product/${product.slug}`}
      className="group relative block overflow-hidden rounded-3xl bg-card shadow-sm transition duration-300 hover:shadow-lg"
    >
      <div className="relative aspect-square overflow-hidden bg-white">
        {image ? (
          <Image
            src={image}
            alt={product.images[0]?.alt ?? product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
            className={cn(
              "object-cover transition duration-500 group-hover:scale-105",
              soldOut && "opacity-60"
            )}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            No image
          </div>
        )}
        {soldOut && (
          <span className="absolute left-3 top-3 rounded-full bg-background/90 px-2.5 py-1 text-xs font-medium">
            Sold out
          </span>
        )}
        {!soldOut && compareAt && compareAt > price && (
          <span className="absolute left-3 top-3 rounded-full bg-destructive px-2.5 py-1 text-xs font-medium text-white">
            Sale
          </span>
        )}
      </div>

      <div className="space-y-1.5 p-4">
        <h3 className="line-clamp-2 font-serif text-lg font-light leading-snug">
          {product.name}
        </h3>
        {product.reviewCount > 0 && (
          <StarRating rating={product.rating ?? 0} count={product.reviewCount} />
        )}
        <div className="flex items-center gap-2 text-sm">
          <span className={cn(compareAt && compareAt > price && "text-destructive")}>
            {formatMoney(price)}
          </span>
          {compareAt && compareAt > price && (
            <span className="text-muted-foreground line-through">
              {formatMoney(compareAt)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
