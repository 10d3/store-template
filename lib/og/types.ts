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
  logo?: string
  accentColor?: string
  bgColor?: string
}

export type OGTemplate = (props: OGTemplateProps) => JSX.Element
