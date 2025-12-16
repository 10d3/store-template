interface PriceSummaryProps {
  total: number
  original: number
  currency?: string
}

export function PriceSummary({ total, original, currency = "$" }: PriceSummaryProps) {
  const savings = original - total

  return (
    <div className="mb-6 p-4 rounded-lg bg-muted/50">
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm text-muted-foreground">Total</span>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-semibold text-foreground">
            {currency}
            {total.toFixed(2)}
          </span>
          <span className="text-sm text-muted-foreground line-through">
            {currency}
            {original.toFixed(2)}
          </span>
        </div>
      </div>
      <p className="text-xs text-muted-foreground text-right">
        You save {currency}
        {savings.toFixed(2)}
      </p>
    </div>
  )
}
