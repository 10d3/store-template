import { Quote, ArrowLeft, ArrowRight } from "lucide-react";
import StarRating from "@/components/shared/star-rating";
import Image from "next/image";

export function TestimonialCarousel({
  title,
  testimonials,
}: {
  title: string;
  testimonials: { quote: string; name: string; avatar?: string; rating: number }[];
}) {
  if (!testimonials || testimonials.length === 0) return null;

  return (
    <section className="py-8 w-full">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
        <h2 className="text-3xl md:text-4xl font-serif text-foreground max-w-sm leading-tight">
          {title}
        </h2>
        <div className="flex gap-4">
          <button className="w-10 h-10 rounded-full bg-background border border-border flex items-center justify-center text-muted-foreground hover:bg-secondary transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <button className="w-10 h-10 rounded-full bg-primary border border-primary flex items-center justify-center text-primary-foreground hover:opacity-90 transition-opacity">
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {testimonials.map((t, i) => (
          <div key={i} className="bg-background transition-all duration-500 hover:-translate-y-2 hover:shadow-xl border border-border/50 rounded-2xl p-8 relative flex flex-col shadow-sm">
            <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center absolute -top-4 -left-2 shadow-sm">
              <Quote className="w-6 h-6 text-primary-foreground fill-primary-foreground" />
            </div>
            
            <div className="mt-6 mb-4">
              <StarRating rating={t.rating} size="sm" />
            </div>
            
            <p className="text-muted-foreground leading-relaxed mb-8 flex-grow text-sm md:text-base">
              "{t.quote}"
            </p>
            
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-secondary rounded-full overflow-hidden relative">
                {t.avatar ? (
                  <Image src={t.avatar} alt={t.name} fill className="object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-border font-medium">
                    {t.name.charAt(0)}
                  </div>
                )}
              </div>
              <span className="font-semibold text-foreground">{t.name}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
