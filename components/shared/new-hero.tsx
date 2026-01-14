"use client"
import { heroConfig } from "@/lib/data/hero";
import { Badge } from "../ui/badge";
import { Card, CardContent, CardDescription, CardTitle } from "../ui/card";
import { FeatureCard } from "./hero/featured-card";
import { Button } from "../ui/button";
import Link from "next/link";

export default function NewHero() {
    return (
        <div className="flex flex-col md:justify-center gap-4">
            <Card className="w-full md:py-7 bg-[url('/Untitled-3@3x.png')] md:bg-[url('/banner@3x.png')] bg-contain bg-no-repeat bg-center md:bg-contain h-[500px] md:h-fit">
                <CardContent className="md:my-auto gap-4 flex flex-col w-full md:w-2/5">
                    <Badge className="border-transparent bg-[#73BF44] text-primary-foreground [a&]:hover:bg-[#73BF44]/90">Simple. Natural. Effective.</Badge>
                    <CardTitle className=" text-3xl md:text-6xl">Your vitality. Your rhythm. Your life.</CardTitle>
                    <CardDescription className="text-lg md:text-xl md:min-w-3/5 w-full text-pretty">Natural support for energy, balance, and confidence — without compromise.</CardDescription>
                    <Button asChild className="md:min-w-2/5 bg-[#063354] hover:bg-[#063354]/90 dark:bg-white dark:hover:bg-white/90">
                        <Link href="#products">Start your wellness journey</Link>
                    </Button>
                </CardContent>
            </Card>
            <div className="grid md:grid-cols-3 gap-6">
                {heroConfig.featureCards.map((card) => (
                    <FeatureCard key={card.id} card={card} />
                ))}
            </div>
        </div>
    )
}