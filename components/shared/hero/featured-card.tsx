"use client"

import type React from "react"

import { useState } from "react"
import { ArrowUpRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { FeatureCard as FeatureCardType } from "@/types/hero"
import Image from "next/image"

interface FeatureCardProps {
    card: FeatureCardType
}

export function FeatureCard({ card }: FeatureCardProps) {
    const [email, setEmail] = useState("")

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (card.form?.onSubmit) {
            card.form.onSubmit(email)
            setEmail("")
        }
    }

    return (
        <div
            className="group relative rounded-3xl overflow-hidden h-[380px]"
            style={{
                background: `linear-gradient(to bottom, ${card.gradientFrom}, ${card.gradientTo})`,
            }}
        >
            <div className="absolute inset-0">
                <Image height={1000} width={1000} src={card.imageSrc || "/placeholder.svg"} alt={card.imageAlt} className="w-full h-full object-cover" />
            </div>

            <div className="relative h-full p-6 flex flex-col justify-between">
                {/* Top Button */}
                {card.button.action !== "form" && (
                    <Button
                        variant="secondary"
                        size="sm"
                        className="w-fit bg-white/90 hover:bg-white text-gray-900 rounded-full gap-2"
                    >
                        {card.button.label}
                        {card.button.action === "video" && <ArrowUpRight className="w-4 h-4" />}
                    </Button>
                )}

                {card.button.action === "form" && (
                    <Button variant="secondary" size="sm" className="w-fit bg-white/90 hover:bg-white text-gray-900 rounded-full">
                        {card.button.label}
                    </Button>
                )}

                {/* Bottom Content */}
                <div className="space-y-4">
                    <h3 className="text-2xl font-bold text-white drop-shadow-lg">
                        {card.title.split("\n").map((line, i) => (
                            <span key={i}>
                                {line}
                                {i < card.title.split("\n").length - 1 && <br />}
                            </span>
                        ))}
                    </h3>

                    {/* Email Form for CTA Card */}
                    {card.form && (
                        <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-2">
                            <Input
                                type="email"
                                placeholder={card.form.placeholder}
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="bg-white/90 border-0 rounded-full md:h-11"
                            />
                            <Button type="submit" className="bg-white hover:bg-white/90 text-gray-900 rounded-full px-6 md:h-11">
                                {card.form.submitLabel}
                            </Button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    )
}
