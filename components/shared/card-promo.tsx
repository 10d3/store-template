"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Copy } from "./copy";

interface CardPromoProps {
  title: string;
  subtitle?: string;
  className?: string;
  backgroundColor?: string;
  textColor?: string;
  promoCode?: string;
  discountPercentage?: number;
  children?: React.ReactNode;
}

export default function CardPromo({
  title,
  subtitle,
  className,
  backgroundColor = "bg-lime-500",
  textColor = "text-white",
  promoCode,
  discountPercentage,
  children,
}: CardPromoProps) {
  return (
    <div
      className={cn(
        "relative rounded-3xl p-8 overflow-hidden",
        backgroundColor,
        textColor,
        className
      )}
    >
      <div className="flex flex-col gap-4">
        {discountPercentage && (
          <div className="flex flex-col">
            <span className="text-4xl font-bold">
              {discountPercentage}%
            </span>
            <span className="text-xl">Ahorra</span>
          </div>
        )}
        <div className="space-y-2">
          <h2 className="text-2xl font-bold">{title}</h2>
          {subtitle && (
            <p className="text-lg opacity-80">{subtitle}</p>
          )}
          {children}
        </div>
        {promoCode && (
          <div className="flex items-center gap-2">
            <span className="text-sm opacity-80">usa el código</span>
            <div className="flex items-center gap-2 bg-black/20 rounded-full px-4 py-2">
              <span className="font-mono font-bold">{promoCode}</span>
              <Copy value={promoCode} className="text-current" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}