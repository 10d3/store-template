import type { TrustIndicator } from "@/types/product"

interface TrustIndicatorsProps {
  indicators: TrustIndicator[]
}

export function TrustIndicators({ indicators }: TrustIndicatorsProps) {
  return (
    <div className="mt-6 pt-6 border-t border-border">
      <div
        className="grid gap-4 text-center"
        style={{ gridTemplateColumns: `repeat(${indicators.length}, minmax(0, 1fr))` }}
      >
        {indicators.map((indicator, index) => (
          <div key={index}>
            <div className="text-lg font-semibold text-foreground">{indicator.value}</div>
            <div className="text-xs text-muted-foreground">{indicator.label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
