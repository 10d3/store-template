"use client"
import { heroConfig } from "@/lib/data/hero";
import { Badge } from "../ui/badge";
import { Card, CardContent, CardDescription, CardTitle } from "../ui/card";
import { FeatureCard } from "./hero/featured-card";

export default function NewHero() {
    return (
        <div className="flex flex-col md:justify-center gap-4 h-fit">
            <Card className="w-full bg-[url('/logo.png')] bg-cover bg-center h-[600px]">
                <CardContent className="md:my-auto gap-4 flex flex-col w-full md:w-2/5">
                    <Badge className="">Mind-Body-Soul Balance</Badge>
                    <CardTitle className=" text-3xl md:text-6xl">Achieve balance in mind, body, and soul</CardTitle>
                    <CardDescription className="text-lg md:text-xl md:w-3/5 w-full text-pretty">Experience the power of balance in mind, body, and soul with our premium products</CardDescription>
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