"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { subscribeToNewsletter } from "@/lib/actions/newsletter"

interface NewsletterProps {
    heading?: string
    description?: string
    source?: string
    className?: string
}

export function Newsletter({
    heading = "Stay in the loop",
    description = "Get wellness tips, product updates, and exclusive offers delivered to your inbox.",
    source = "footer",
    className = ""
}: NewsletterProps) {
    const [email, setEmail] = useState("")
    const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
    const [message, setMessage] = useState("")

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setStatus("loading")

        const result = await subscribeToNewsletter(email, source)

        if (result.success) {
            setStatus("success")
            setMessage(result.message)
            setEmail("")
        } else {
            setStatus("error")
            setMessage(result.message)
        }
    }

    return (
        <section className={`py-16 px-4 bg-card rounded-xl ${className}`}>
            <div className="max-w-2xl mx-auto text-center">
                <h2 className="text-2xl md:text-3xl font-bold mb-3">
                    {heading}
                </h2>
                <p className="mb-6">
                    {description}
                </p>

                {status === "success" ? (
                    <p className="text-green-600 font-medium">
                        {message} 🎉
                    </p>
                ) : status === "error" ? (
                    <p className="text-red-600 font-medium">
                        {message}
                    </p>
                ) : (
                    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                        <Input
                            type="email"
                            placeholder="Enter your email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="flex-1 h-12 rounded-full px-5"
                        />
                        <Button
                            type="submit"
                            disabled={status === "loading"}
                            className="h-12 px-8 rounded-full"
                        >
                            {status === "loading" ? "Subscribing..." : "Subscribe"}
                        </Button>
                    </form>
                )}
            </div>
        </section>
    )
}
