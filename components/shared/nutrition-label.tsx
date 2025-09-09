import type React from "react"
import "server-only"
import { MDXRemote } from "next-mdx-remote/rsc"
import Link from "next/link"
import { Card } from "../ui/card"
import { Button } from "../ui/button"

const SupplementPanel = ({ children }: { children: React.ReactNode }) => (
  <div className="max-w-5xl mx-auto rounded-xl overflow-hidden shadow-sm bg-card p-0">
    {children}
  </div>
)

const ProductHeader = ({ title, icon }: { title: string; icon?: string }) => (
  <div className="px-0 py-5">
    <div className="flex items-center justify-between">
      <h1 className="text-xl font-semibold text-foreground tracking-tight">{title}</h1>
      {icon && (
        <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center text-primary-foreground text-lg font-medium shadow-sm">
          {icon}
        </div>
      )}
    </div>
  </div>
)

const SupplementLayout = ({ children }: { children: React.ReactNode }) => (
  <div className="grid grid-cols-1 xl:grid-cols-2 gap-0">{children}</div>
)

const MainInfo = ({ children }: { children: React.ReactNode }) => (
  <div className="p-0 space-y-5 xl:border-r border-border bg-card/50">{children}</div>
)

const AdditionalInfo = ({ children }: { children: React.ReactNode }) => (
  <div className="py-6 space-y-5 bg-card/30">{children}</div>
)

const ProductDetails = ({ children }: { children: React.ReactNode }) => (
  <Card className="bg-muted/20 border border-border rounded-lg p-5 space-y-3">{children}</Card>
)

const DetailRow = ({
  label,
  value,
  bold = false,
}: {
  label: string
  value: string
  bold?: boolean
}) => (
  <div className="flex flex-wrap items-center gap-2 py-2 border-b border-border/50 last:border-b-0">
    <span className="font-medium text-muted-foreground text-sm">{label}:</span>
    <span className={`text-foreground ${bold ? "font-semibold" : "font-normal"}`}>{value}</span>
  </div>
)

const TabNavigation = ({
  activeTab = "Por dosis",
  tabs = ["Por dosis", "Por 100 g", "Por dosis diaria"],
}: {
  activeTab?: string
  tabs?: string[]
}) => (
  <div className="flex gap-2 flex-wrap p-1 bg-muted/30 rounded-lg">
    {tabs.map((tab) => (
      <Button
        key={tab}
        variant={tab === activeTab ? "default" : "ghost"}
        size="sm"
        className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
          tab === activeTab
            ? "bg-primary text-primary-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
        }`}
      >
        {tab}
      </Button>
    ))}
  </div>
)

const NutritionalTable = ({ children }: { children: React.ReactNode }) => (
  <Card className="bg-card border border-border rounded-lg overflow-hidden p-0">
    <div className="divide-y divide-border">{children}</div>
  </Card>
)

const NutrientRow = ({
  name,
  amount,
  percentage,
  isHeader = false,
}: {
  name: string
  amount: string
  percentage?: string
  isHeader?: boolean
}) => (
  <div
    className={`flex justify-between items-center px-4 py-3 ${
      isHeader ? "bg-muted/40 font-semibold text-foreground" : "bg-card hover:bg-muted/20 transition-colors"
    }`}
  >
    <span className={`${isHeader ? "font-semibold text-base" : "text-sm font-medium"} text-foreground`}>{name}</span>
    <div className="text-right">
      <div className={`${isHeader ? "font-semibold text-base" : "text-sm font-medium"} text-foreground`}>{amount}</div>
      {percentage && <div className="text-xs text-muted-foreground mt-0.5">{percentage}</div>}
    </div>
  </div>
)

const ReferenceNotes = ({ children }: { children: React.ReactNode }) => (
  <div className="text-xs text-muted-foreground space-y-1 mt-4 leading-relaxed">{children}</div>
)

const InfoSection = ({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) => (
  <Card className="bg-card border border-border rounded-lg p-5 space-y-3 shadow-sm">
    <h3 className="font-semibold text-lg text-foreground mb-3 tracking-tight">{title}</h3>
    <div className="text-sm leading-relaxed text-muted-foreground space-y-2">{children}</div>
  </Card>
)

const IngredientsList = ({ ingredients }: { ingredients: string }) => (
  <InfoSection title="Ingredientes">
    <p className="text-foreground leading-relaxed">{ingredients}</p>
  </InfoSection>
)

const UsageInstructions = ({
  dailyDose,
  instructions,
}: {
  dailyDose: string
  instructions: string
}) => (
  <InfoSection title="How to Use">
    <div className="space-y-3">
      <div>
        <span className="font-semibold text-foreground text-sm">Daily Dose:</span>
        <p className="text-foreground mt-1">{dailyDose}</p>
      </div>
      <div>
        <span className="font-semibold text-foreground text-sm">Instructions:</span>
        <p className="text-foreground mt-1">{instructions}</p>
      </div>
    </div>
  </InfoSection>
)

const WarningsSection = ({ children }: { children: React.ReactNode }) => (
  <Card className="bg-destructive/5 border border-destructive/20 rounded-lg p-5">
    <h3 className="font-semibold text-lg text-destructive mb-3 tracking-tight">Warnings</h3>
    <div className="text-sm leading-relaxed text-destructive/80 space-y-2">{children}</div>
  </Card>
)

const AllergenInfo = ({
  allergens,
  registrationCode,
}: {
  allergens?: string
  registrationCode?: string
}) => (
  <Card className="bg-muted/20 border border-border rounded-lg p-4 space-y-2">
    {allergens && <p className="text-sm text-muted-foreground leading-relaxed">{allergens}</p>}
    {registrationCode && (
      <p className="text-xs text-muted-foreground font-mono">
        Código de registro: <span className="font-semibold">{registrationCode}</span>
      </p>
    )}
  </Card>
)

const mdxComponents = {
  a: (props: React.ComponentProps<typeof Link>) => (
    <Link {...props} className="text-primary hover:text-primary/80 underline underline-offset-2 transition-colors" />
  ),
  h1: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h1 className="mt-8 mb-6 text-4xl font-bold text-center text-foreground tracking-tight" {...props} />
  ),
  h2: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h2 className="mt-8 mb-4 text-3xl font-semibold text-foreground tracking-tight" {...props} />
  ),
  h3: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h3 className="mt-6 mb-3 text-2xl font-medium text-foreground tracking-tight" {...props} />
  ),
  p: (props: React.HTMLAttributes<HTMLParagraphElement>) => (
    <p className="mb-4 leading-relaxed text-foreground" {...props} />
  ),
  ul: (props: React.HTMLAttributes<HTMLUListElement>) => (
    <ul className="list-disc list-inside space-y-2 text-foreground ml-4" {...props} />
  ),
  ol: (props: React.HTMLAttributes<HTMLOListElement>) => (
    <ol className="list-decimal list-inside space-y-2 text-foreground ml-4" {...props} />
  ),
  li: (props: React.HTMLAttributes<HTMLLIElement>) => <li className="leading-relaxed" {...props} />,
  br: () => <br className="my-2" />,

  // Enhanced supplement components
  SupplementPanel,
  ProductHeader,
  SupplementLayout,
  MainInfo,
  AdditionalInfo,
  ProductDetails,
  DetailRow,
  TabNavigation,
  NutritionalTable,
  NutrientRow,
  ReferenceNotes,
  InfoSection,
  IngredientsList,
  UsageInstructions,
  WarningsSection,
  AllergenInfo,
}

export const MarkdownNutrition = async ({ source }: { source: string }) => {
  return <MDXRemote source={source} components={mdxComponents} />
}
