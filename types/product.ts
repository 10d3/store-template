export interface StripeProduct {
  id: string
  name: string
  description?: string
  images?: string[]
  metadata?: Record<string, string>
  default_price?: {
    id: string
    unit_amount: number
    currency: string
  }
  active: boolean
}

export interface StripeCoupon {
  id: string
  name?: string
  percent_off?: number
  amount_off?: number
  currency?: string
  duration: string
  valid: boolean
}