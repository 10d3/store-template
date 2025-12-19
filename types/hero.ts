export interface HeroContent {
    tagline: string
    heading: string
    description: string
}

export interface CircularBandConfig {
    text: string
    imageSrc: string
    imageAlt: string
    color: string
    animationDuration?: string
}

export interface FeatureCard {
    id: string
    title: string
    imageSrc: string
    imageAlt: string
    gradientFrom: string
    gradientTo: string
    button?: {
        label: string
        action: "video" | "cta" | "form"
    }
    form?: {
        placeholder: string
        submitLabel: string
        onSubmit?: (email: string) => void
    }
}

export interface HeroSectionConfig {
    content: HeroContent
    circularBand: CircularBandConfig
    featureCards: FeatureCard[]
}
