import { MinimalBlogTemplate } from "@/components/og-template/minimal-blog"
import type { OGTemplate } from "./types"
import { ModernDarkTemplate } from "@/components/og-template/modern-dark"
import { ElegantSerifTemplate } from "@/components/og-template/elegant-serif"

export const templates: Record<string, OGTemplate> = {
  "minimal-blog": MinimalBlogTemplate,
  "modern-dark": ModernDarkTemplate,
  "elegant-serif": ElegantSerifTemplate,
}

export { MinimalBlogTemplate, ModernDarkTemplate, ElegantSerifTemplate }
export * from "./types"
