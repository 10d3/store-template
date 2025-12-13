"use client"

import { motion, AnimatePresence } from "motion/react"
import { Card } from "@/components/ui/card"
import { X, CheckCircle2 } from "lucide-react"
import Image from "next/image"
import type { MockPurchase } from "@/lib/social-proof-data"

interface SocialProofNotificationProps {
    purchase: MockPurchase | null
    isVisible: boolean
    onClose: () => void
    position?: "bottom-left" | "bottom-right" | "top-left" | "top-right"
}

export default function SocialProofNotification({
    purchase,
    isVisible,
    onClose,
    position = "bottom-left",
}: SocialProofNotificationProps) {
    if (!purchase) return null

    // Position classes
    const positionClasses = {
        "bottom-left": "bottom-6 left-6",
        "bottom-right": "bottom-6 right-6",
        "top-left": "top-24 left-6",
        "top-right": "top-24 right-6",
    }

    // Animation variants based on position
    const getAnimationVariants = () => {
        const isBottom = position.includes("bottom")
        const isLeft = position.includes("left")
        return {
            initial: {
                opacity: 0,
                y: isBottom ? 40 : -40,
                x: isLeft ? -20 : 20,
                scale: 0.9,
            },
            animate: {
                opacity: 1,
                y: 0,
                x: 0,
                scale: 1,
            },
            exit: {
                opacity: 0,
                scale: 0.85,
                transition: {
                    duration: 0.2,
                },
            },
        }
    }

    const variants = getAnimationVariants()

    return (
        <AnimatePresence mode="wait">
            {isVisible && (
                <motion.div
                    className={`fixed ${positionClasses[position]} z-50 w-[400px] max-w-[calc(100vw-3rem)]`}
                    initial={variants.initial}
                    animate={variants.animate}
                    exit={variants.exit}
                    transition={{
                        duration: 0.5,
                        ease: [0.16, 1, 0.3, 1],
                    }}
                >
                    <Card className="group relative overflow-hidden border-border/40 bg-background/80 backdrop-blur-xl shadow-2xl shadow-black/5 p-2">
                        {/* Success indicator */}
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-emerald-500 to-teal-500" />

                        <div className="flex items-start gap-4 p-2">
                            {/* Product Image with refined styling */}
                            <motion.div
                                className="relative h-20 w-24 flex-shrink-0 overflow-hidden rounded-xl bg-muted ring-1 ring-border/50"
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: 0.1, duration: 0.4 }}
                            >
                                <Image
                                    src={purchase.productImage || "/placeholder.svg"}
                                    alt={purchase.productName}
                                    fill
                                    className="object-cover"
                                // sizes="64px"
                                />
                            </motion.div>

                            {/* Content with improved typography */}
                            <div className="flex-1 min-w-0 pt-0.5">
                                <div className="flex items-start justify-between gap-2 mb-2">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                                        <span className="text-sm font-medium text-foreground">New purchase</span>
                                    </div>
                                    <button
                                        onClick={onClose}
                                        className="flex-shrink-0 p-1.5 -mt-1 -mr-1 rounded-lg text-muted-foreground/60 hover:text-foreground hover:bg-muted/50 transition-colors duration-200"
                                        aria-label="Dismiss notification"
                                    >
                                        <X className="h-3.5 w-3.5" />
                                    </button>
                                </div>

                                <p className="text-sm text-foreground/90 leading-relaxed mb-1">
                                    <span className="font-semibold">{purchase.firstName}</span>
                                    <span className="text-muted-foreground"> from </span>
                                    <span className="text-muted-foreground/80">{purchase.location}</span>
                                </p>

                                <p className="text-sm font-medium text-foreground/95 truncate mb-2">{purchase.productName}</p>

                                <p className="text-xs text-muted-foreground/60 font-medium">{purchase.timeAgo}</p>
                            </div>
                        </div>

                        {/* Subtle shine effect */}
                        <motion.div
                            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.03] to-transparent pointer-events-none"
                            initial={{ x: "-100%" }}
                            animate={{ x: "100%" }}
                            transition={{
                                duration: 1.5,
                                ease: "easeInOut",
                                repeat: Number.POSITIVE_INFINITY,
                                repeatDelay: 3,
                            }}
                        />
                    </Card>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
