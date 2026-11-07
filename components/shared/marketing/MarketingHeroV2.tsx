import { type ProductWithVariants } from "@/lib/catalog";
import StarRating from "@/components/shared/star-rating";
import { formatPrice } from "@/lib/utils";
import { BookOpen, ShieldCheck, Truck } from "lucide-react";
import Image from "next/image";

export function MarketingHeroV2({
  product,
  averageRating,
  reviewCount,
  actionPanel, // The actual AddToCart / Quantity functionality is passed in from the page
  images,
}: {
  product: ProductWithVariants;
  averageRating: number;
  reviewCount: number;
  actionPanel: React.ReactNode;
  images: string[];
}) {
  const defaultPrice =
    product.defaultVariant?.price ?? product.variants?.[0]?.price;

  const mainImage = images[0] || "/placeholder.jpg";
  const thumb1 = images[1] || mainImage;
  const thumb2 = images[2] || mainImage;

  const description =
    product.description ||
    "Vlyora Core is a premium dietary supplement designed to strengthen your spine your body's central pillar from the inside out. It delivers essential vitamins, minerals, and omega-3 fatty acids that support posture, mobility, and core strength. Together with our free exercise eBook, Vlyora Core provides a holistic system for back health inner stability meets outer strength.";

  return (
    <div className="grid lg:grid-cols-2 gap-6 lg:gap-5 lg:h-[calc(93vh-5rem)] items-stretch pb-4 lg:py-0">
      {/* Left Column: Images */}
      <div className="flex h-full min-w-0 flex-col gap-4 w-full max-w-xl mx-auto lg:mx-0">
        <div className="bg-[#b8cee1] dark:bg-[#22303c] rounded-2xl flex-1 min-h-[50vh] hover:shadow-lg transition-shadow duration-500 relative overflow-hidden flex items-center justify-center p-8 w-full">
          <Image src={mainImage} alt={product.name} fill className="object-contain scale-105 hover:scale-110 transition-transform duration-500" />
        </div>
        <div className="grid grid-cols-2 gap-4 shrink-0">
          <div className="bg-[#b8cee1] dark:bg-[#22303c] rounded-xl aspect-square relative hover:opacity-90 hover:scale-[1.02] cursor-pointer transition-all duration-300 overflow-hidden flex items-center justify-center p-6">
            <Image src={thumb1} alt="Thumbnail 1" fill className="object-contain" />
          </div>
          <div className="bg-[#b8cee1] dark:bg-[#22303c] rounded-xl aspect-square relative hover:opacity-90 hover:scale-[1.02] cursor-pointer transition-all duration-300 overflow-hidden flex items-center justify-center p-6">
            <Image src={thumb2} alt="Thumbnail 2" fill className="object-contain" />
          </div>
        </div>
      </div>

      {/* Right Column: Product Details */}
      <div className="flex h-full min-w-0 flex-col justify-between">
        {/* Top group: product details — hugs the top on lg so it aligns with the image top */}
        <div>
          <div className="text-sm text-muted-foreground mb-3">
            Shop &gt; <span className="text-foreground">Product Details</span>
          </div>

          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-foreground mb-2">
            {product.name}
          </h1>

          <p className="text-base md:text-lg text-muted-foreground mb-6">
            {product.subtitle || "30-Day Supply (60 Capsules)"}
          </p>

          <div className="flex flex-wrap items-center gap-3 mb-5">
            {product.metadata?.original_price && (
              <span className="text-lg md:text-xl text-muted-foreground line-through">
                {product.metadata.original_price}
              </span>
            )}
            <span className="text-3xl font-bold text-foreground">
              {defaultPrice ? formatPrice(defaultPrice) : "Free"}
            </span>
            {product.metadata?.discount_badge && (
              <span className="bg-background border border-border px-3 py-1 rounded-full text-sm font-medium text-foreground">
                {product.metadata.discount_badge}
              </span>
            )}
            <div className="ml-auto flex items-center gap-1.5">
              <StarRating
                rating={averageRating}
                size="sm"
                className="[&_svg]:fill-amber-400 [&_svg]:text-amber-400"
              />
              <span className="text-sm font-bold text-foreground">{averageRating.toFixed(1)}</span>
              <span className="text-sm text-muted-foreground">{reviewCount} Reviews</span>
            </div>
          </div>

          <p className="text-base md:text-lg text-foreground mb-5 leading-relaxed">
            {product.metadata?.hero_tagline || "Your Daily Foundation for a Strong, Flexible, and Balanced Back"}
          </p>

          <div className="h-px w-full bg-border/60 mb-5" />

          <h3 className="text-xl md:text-2xl font-bold text-foreground mb-3">Product description</h3>
          <div className="text-muted-foreground mb-6 text-sm md:text-base leading-relaxed whitespace-pre-line lg:line-clamp-14 [overflow-wrap:anywhere]">
            {description}
          </div>
        </div>

        {/* Bottom group: actions + trust badges — hugs the bottom on lg so it aligns with the image bottom */}
        <div>
          <div className="mb-5 w-full">
            {/* The actual AddToCart / Quantity functionality from the page will slot here */}
            {actionPanel}
          </div>

          {/* Trust Badges */}
          <div className="grid grid-cols-3 rounded-xl border border-border bg-background p-6">
            <div className="flex flex-col items-center text-center gap-2">
              <BookOpen className="w-6 h-6 text-foreground stroke-[1.5]" />
              <span className="text-sm text-muted-foreground leading-snug">Free eBook with every order</span>
            </div>
            <div className="flex flex-col items-center text-center gap-2 border-x border-border/60 px-2">
              <ShieldCheck className="w-6 h-6 text-foreground stroke-[1.5]" />
              <span className="text-sm text-muted-foreground leading-snug">Fast, secure checkout</span>
            </div>
            <div className="flex flex-col items-center text-center gap-2">
              <Truck className="w-6 h-6 text-foreground stroke-[1.5]" />
              <span className="text-sm text-muted-foreground leading-snug">Free shipping within Germany</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
