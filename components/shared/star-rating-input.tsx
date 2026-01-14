"use client";

import { cn } from "@/lib/utils";
import { Star } from "lucide-react";
import { useState } from "react";

interface StarRatingInputProps {
    value: number;
    onChange: (value: number) => void;
    maxRating?: number;
    size?: "sm" | "md" | "lg";
    allowHalf?: boolean;
    className?: string;
}

export default function StarRatingInput({
    value,
    onChange,
    maxRating = 5,
    size = "lg",
    allowHalf = true,
    className,
}: StarRatingInputProps) {
    const [hoverValue, setHoverValue] = useState<number | null>(null);

    const sizeClasses = {
        sm: "w-5 h-5",
        md: "w-6 h-6",
        lg: "w-8 h-8",
    };

    const displayValue = hoverValue ?? value;

    const handleClick = (starIndex: number, isHalf: boolean) => {
        const newValue = isHalf && allowHalf ? starIndex + 0.5 : starIndex + 1;
        onChange(newValue);
    };

    const handleMouseMove = (
        e: React.MouseEvent<HTMLButtonElement>,
        starIndex: number
    ) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const isHalf = x < rect.width / 2;
        setHoverValue(isHalf && allowHalf ? starIndex + 0.5 : starIndex + 1);
    };

    return (
        <div className={cn("flex items-center gap-1", className)}>
            {Array.from({ length: maxRating }).map((_, i) => {
                const starValue = i + 1;
                const isFilled = displayValue >= starValue;
                const isHalfFilled = displayValue >= i + 0.5 && displayValue < starValue;

                return (
                    <button
                        key={i}
                        type="button"
                        className="relative cursor-pointer transition-transform hover:scale-110"
                        onMouseMove={(e) => handleMouseMove(e, i)}
                        onMouseLeave={() => setHoverValue(null)}
                        onClick={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            const x = e.clientX - rect.left;
                            const isHalf = x < rect.width / 2;
                            handleClick(i, isHalf);
                        }}
                    >
                        <Star
                            className={cn(
                                sizeClasses[size],
                                isFilled
                                    ? "text-[#73BF44] fill-[#73BF44]"
                                    : isHalfFilled
                                        ? "text-[#73BF44]"
                                        : "text-gray-300"
                            )}
                        />
                        {isHalfFilled && (
                            <div className="absolute inset-0 overflow-hidden w-1/2">
                                <Star
                                    className={cn(
                                        sizeClasses[size],
                                        "text-[#73BF44] fill-[#73BF44]"
                                    )}
                                />
                            </div>
                        )}
                    </button>
                );
            })}
            <span className="ml-2 text-lg font-semibold text-gray-700">
                {displayValue.toFixed(1)}
            </span>
        </div>
    );
}
