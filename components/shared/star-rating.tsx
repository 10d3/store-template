"use client";

import { cn } from "@/lib/utils";
import { Star, StarHalf } from "lucide-react";

interface StarRatingProps {
    rating: number;
    maxRating?: number;
    size?: "sm" | "md" | "lg";
    showValue?: boolean;
    className?: string;
}

export default function StarRating({
    rating,
    maxRating = 5,
    size = "md",
    showValue = false,
    className,
}: StarRatingProps) {
    const sizeClasses = {
        sm: "w-3 h-3",
        md: "w-4 h-4",
        lg: "w-5 h-5",
    };

    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = maxRating - fullStars - (hasHalfStar ? 1 : 0);

    return (
        <div className={cn("flex items-center gap-0.5", className)}>
            {/* Full stars */}
            {Array.from({ length: fullStars }).map((_, i) => (
                <Star
                    key={`full-${i}`}
                    className={cn(sizeClasses[size], "text-[#73BF44] fill-[#73BF44]")}
                />
            ))}

            {/* Half star */}
            {hasHalfStar && (
                <div className="relative">
                    <Star
                        className={cn(sizeClasses[size], "text-gray-300")}
                    />
                    <div className="absolute inset-0 overflow-hidden w-1/2">
                        <Star
                            className={cn(sizeClasses[size], "text-[#73BF44] fill-[#73BF44]")}
                        />
                    </div>
                </div>
            )}

            {/* Empty stars */}
            {Array.from({ length: emptyStars }).map((_, i) => (
                <Star
                    key={`empty-${i}`}
                    className={cn(sizeClasses[size], "text-gray-300")}
                />
            ))}

            {/* Numeric value */}
            {showValue && (
                <span className="ml-1 text-sm font-medium text-gray-600">
                    {rating.toFixed(1)}
                </span>
            )}
        </div>
    );
}
