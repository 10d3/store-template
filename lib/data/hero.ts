import type { HeroSectionConfig } from "@/types/hero"

export const heroConfig: HeroSectionConfig = {
    content: {
        tagline: "Mind, Body, Soul Balance",
        heading: "Achieve balance in mind, body, and soul.",
        description: "Lorem ipsum dolor sit amet consectetur. Semper malesuada duis ut blandit semper.",
    },
    circularBand: {
        text: "selling point • selling point • selling point • while reducing stress and enhancing emotional",
        imageSrc: "/woman-relaxing-meditation-peace.jpg",
        imageAlt: "Person meditating",
        color: "#7c3aed",
        animationDuration: "20s",
    },
    featureCards: [
        {
            id: "flexibility",
            title: "Improved\nFlexibility",
            imageSrc: "/woman-yoga-stretch-flexibility-exercise.jpg",
            imageAlt: "Yoga flexibility",
            gradientFrom: "#d4e8f0",
            gradientTo: "#a8cce0",
            button: {
                label: "View video",
                action: "video",
            },
        },
        {
            id: "stress-reduction",
            title: "Stress Reduction",
            imageSrc: "/woman-yoga-side-bend-stretch-studio.jpg",
            imageAlt: "Yoga stress reduction",
            gradientFrom: "#e8ddd0",
            gradientTo: "#d4c4b0",
            button: {
                label: "View video",
                action: "video",
            },
        },
        {
            id: "join-class",
            title: "Join Us for a Yoga\nClass Today!",
            imageSrc: "/yoga-class-studio-instructor-group.jpg",
            imageAlt: "Yoga class",
            gradientFrom: "#c8b8a8",
            gradientTo: "#b0a090",
            button: {
                label: "Join our class",
                action: "form",
            },
            form: {
                placeholder: "Your email",
                submitLabel: "Get Started",
                onSubmit: (email: string) => {
                    console.log("Email submitted:", email)
                    // Add your form submission logic here
                },
            },
        },
    ],
}
