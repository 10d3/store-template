import Image from "next/image";
import { formatPrice } from "@/lib/utils";

export function BottomCTA({
  title,
  description,
  price,
  imageSrc,
}: {
  title: string;
  description: string;
  price: number;
  imageSrc: string;
}) {
  return (
    <section className="pb-12 pt-8 w-full">
      <div className="bg-gradient-to-r from-secondary to-muted rounded-[2rem] p-8 md:p-16 flex flex-col md:flex-row items-center gap-12 relative overflow-hidden">
        
        {/* Abstract shapes in the background */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-foreground/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-foreground/10 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4"></div>

        {/* Image */}
        <div className="relative w-48 h-64 md:w-64 md:h-80 flex-shrink-0 z-10">
          <Image src={imageSrc} alt={title} fill className="object-contain" />
        </div>

        {/* Content */}
        <div className="text-center md:text-left z-10">
          <h2 className="text-3xl md:text-4xl font-serif text-foreground mb-4 leading-tight">
            {title}
          </h2>
          <p className="text-foreground/80 mb-8 max-w-md">
            {description}
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="text-2xl font-bold text-foreground">
              {formatPrice(price)}
            </div>
            <button className="bg-background text-foreground hover:bg-background/90 hover:scale-105 active:scale-95 px-8 py-3 rounded-full font-medium transition-colors shadow-sm w-full sm:w-auto">
              Shop Now
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
