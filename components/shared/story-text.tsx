interface StoryTextProps {
    headline: string
    description: string
    className?: string
}

export function StoryText({ headline, description, className = "" }: StoryTextProps) {
    return (
        <div className={`text-center py-16 px-4 max-w-4xl mx-auto ${className}`}>
            <h2 className="text-3xl md:text-6xl font-bold mb-4">
                {headline}
            </h2>
            <p className="text-lg md:text-xl">
                {description}
            </p>
        </div>
    )
}
