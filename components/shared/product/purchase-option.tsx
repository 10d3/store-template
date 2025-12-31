"use client"

import { Badge } from "@/components/ui/badge"
import { Check } from "lucide-react"

interface PurchaseOptionProps {
  type: "subscribe" | "onetime"
  title: string
  price: number
  priceLabel?: string
  description?: string
  isRecommended?: boolean
  isSelected: boolean
  onClick: () => void
}

export function PurchaseOption({
  type,
  title,
  price,
  priceLabel = "each",
  description,
  isRecommended = false,
  isSelected,
  onClick,
}: PurchaseOptionProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full p-2 rounded-xl border-2 transition-all text-left ${isSelected ? "border-foreground bg-accent" : "border-border hover:border-foreground/40"
        }`}
    >
      <div className="flex relative items-start justify-between gap-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium text-foreground">{title}</span>
            {isRecommended && (
              <Badge variant="outline" className={`absolute -top-6 left-1/2 -translate-x-1/2 bg-background text-xs ${isSelected ? "border-foreground bg-accent" : "border-border hover:border-foreground/40"
                }`}>
                Recommended
              </Badge>
            )}
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-semibold text-foreground">${price.toFixed(2)}</span>
            <span className="text-sm text-muted-foreground">{priceLabel}</span>
          </div>
          {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
        </div>
        {/* {isSelected && (
          <div className="w-5 h-5 rounded-full bg-foreground flex items-center justify-center flex-shrink-0 mt-1">
            <Check className="w-3 h-3 text-background" />
          </div>
        )} */}
      </div>
    </button>
  )
}
