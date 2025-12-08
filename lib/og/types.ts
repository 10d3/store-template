import type { JSX } from "react"

export interface OGTemplateProps {
  title: string
  description?: string
  author?: string
  date?: string
  readingTime?: string
  tags?: string[]
  category?: string
  image?: string
  images?: string[] // Array of images for stacked display
  price?: string
  logo?: string
  accentColor?: string
  bgColor?: string
}

export type OGTemplate = (props: OGTemplateProps) => JSX.Element
