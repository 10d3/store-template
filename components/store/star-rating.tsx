import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function StarRating({
  rating,
  count,
  className,
  showCount = true,
}: {
  rating: number;
  count?: number;
  className?: string;
  showCount?: boolean;
}) {
  const rounded = Math.round(rating);

  return (
    <span
      className={cn("inline-flex items-center gap-1.5", className)}
      aria-label={`${rating.toFixed(1)} out of 5 stars`}
    >
      <span className="flex">
        {Array.from({ length: 5 }, (_, index) => (
          <Star
            key={index}
            className={cn(
              "size-3.5",
              index < rounded
                ? "fill-amber-400 text-amber-400"
                : "text-muted-foreground/40"
            )}
          />
        ))}
      </span>
      {showCount && count !== undefined && (
        <span className="text-xs text-muted-foreground">({count})</span>
      )}
    </span>
  );
}
