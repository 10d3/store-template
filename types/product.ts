export interface StripeProduct {
  id: string
  name: string
  description?: string | null
  images?: string[]
  metadata: Record<string, string>
  default_price?: {
    id: string
    unit_amount: number | null
    currency: string
  } | string | null
  active: boolean
}

export interface StripeCoupon {
  id: string
  name?: string | null
  percent_off?: number | null
  amount_off?: number | null
  currency?: string | null
  duration: string
  valid: boolean
  metadata: Record<string, string> | null
}