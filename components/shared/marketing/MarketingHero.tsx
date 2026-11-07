import type { ProductWithVariants } from "@/lib/catalog";
import StarRating from "@/components/shared/star-rating";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";

export function MarketingHero({
  product,
  averageRating,
  reviewCount,
  children, // Media Gallery goes here
  actionPanel, // Variant panel or quantity manager goes here
}: {
  product: ProductWithVariants;
  averageRating: number;
  reviewCount: number;
  children: React.ReactNode;
  actionPanel: React.ReactNode;
}) {
  const isNewArrival =
    product.metadata?.tags
      ?.split(",")
      .some((t) => t.trim().toLowerCase().includes("new")) ?? false;

  const defaultPrice = product.defaultVariant?.price ?? product.minPrice;

  return (
    <div className="grid lg:grid-cols-12 gap-8 lg:gap-16 pt-8 pb-12">
      {/* Left Column: Text & Marketing Hook */}
      <div className="lg:col-span-6 flex flex-col justify-center order-2 lg:order-1 space-y-6">
        <div className="space-y-4">
          <div className="flex items-center gap-3 flex-wrap">
            {isNewArrival && (
              <Badge variant="secondary" className="uppercase tracking-widest text-xs">
                New Arrival
              </Badge>
            )}
            {product.metadata?.hero_eyebrow && (
              <span className="text-xs font-semibold tracking-widest uppercase text-muted-foreground flex items-center gap-2">
                <span className="w-8 h-px bg-primary hidden md:inline-block"></span>
                {product.metadata.hero_eyebrow}
              </span>
            )}
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground leading-[1.1]">
            {product.metadata?.hero_headline ? (
              <span dangerouslySetInnerHTML={{ __html: product.metadata.hero_headline.replace(/_([^_]+)_/g, '<em class="font-normal italic text-primary/80">$1</em>') }} />
            ) : (
              product.name
            )}
          </h1>

          <p className="text-xl md:text-2xl text-muted-foreground italic font-medium leading-relaxed">
            {product.subtitle || product.metadata?.hero_subtitle || "Natural support for your daily routine."}
          </p>

          <p className="text-base text-muted-foreground leading-relaxed max-w-[480px]">
            {product.metadata?.hero_description || product.description || "Designed to support your wellness journey every single day."}
          </p>
        </div>

        <a href="#reviews" className="flex items-center gap-3 hover:opacity-80 transition-opacity w-fit mt-2">
          <StarRating rating={averageRating} size="sm" />
          <span className="text-sm font-medium text-muted-foreground">
            {averageRating.toFixed(1)} · {reviewCount} verified {reviewCount === 1 ? 'buyer' : 'buyers'}
          </span>
        </a>

        <div className="flex items-center gap-6 mt-4">
          <div className="text-4xl font-bold text-foreground">
            {defaultPrice ? formatPrice(defaultPrice) : "Free"}
          </div>
          {product.metadata?.hero_supply_note && (
            <div className="text-sm text-muted-foreground leading-snug">
              <span dangerouslySetInnerHTML={{ __html: product.metadata.hero_supply_note.replace(/\n/g, '<br>') }} />
            </div>
          )}
        </div>

        <div className="mt-4 w-full max-w-[400px]">
          {actionPanel}
        </div>

        {product.metadata?.hero_trust_bullets && (
          <div className="flex flex-wrap gap-x-6 gap-y-3 mt-6">
            {product.metadata.hero_trust_bullets.split(",").map((bullet, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0"></span>
                {bullet.trim()}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Right Column: Product Gallery / Visual */}
      <div className="lg:col-span-6 order-1 lg:order-2">
        <div className="sticky top-24">
          {children}
        </div>
      </div>
    </div>
  );
}
