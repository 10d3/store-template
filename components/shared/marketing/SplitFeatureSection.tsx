import Image from "next/image";
import { CheckCircle2 } from "lucide-react";

export function SplitFeatureSection({
  title,
  content,
  imageSrc,
  imagePosition = "right",
  bullets,
}: {
  title: string;
  content?: string;
  imageSrc: string;
  imagePosition?: "left" | "right";
  bullets?: string[];
}) {
  return (
    <section className="py-8 w-full">
      <div className="grid md:grid-cols-2 gap-12 md:gap-24 items-center">

        {/* Content Side */}
        <div className={`space-y-6 ${imagePosition === "left" ? "md:order-2" : "md:order-1"}`}>
          <h2 className="text-3xl md:text-4xl font-serif text-foreground leading-tight">
            {title}
          </h2>

          {content && (
            <p className="text-lg text-muted-foreground leading-relaxed">
              {content}
            </p>
          )}

          {bullets && bullets.length > 0 && (
            <div className="space-y-4 pt-4">
              {bullets.map((bullet, i) => (
                <div key={i} className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-foreground flex-shrink-0 stroke-[1.5]" />
                  <span className="text-lg text-foreground font-medium">{bullet}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Image Side */}
        <div className={`bg-secondary rounded-2xl group  aspect-square relative overflow-hidden flex items-center justify-center p-8 ${imagePosition === "left" ? "md:order-1" : "md:order-2"}`}>
          <Image src={imageSrc} alt={title} fill className="object-cover transition-transform duration-700 group-hover:scale-105" />
        </div>

      </div>
    </section>
  );
}
