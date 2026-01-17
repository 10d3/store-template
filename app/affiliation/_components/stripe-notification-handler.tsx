"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { toast } from "sonner"
import { Check, X } from "lucide-react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

export function StripeNotificationHandler() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const [dialogOpen, setDialogOpen] = useState(false)
    const [status, setStatus] = useState<"success" | "error" | null>(null)
    const [message, setMessage] = useState<string>("")

    useEffect(() => {
        const success = searchParams.get("success")

        if (success === "true") {
            setStatus("success")
            setMessage("Your Stripe account has been connected")
            setDialogOpen(true)
            toast.success("Stripe connected")
        } else if (success === "false") {
            setStatus("error")
            setMessage("We couldn't connect your account. Please try again.")
            setDialogOpen(true)
            toast.error("Connection failed")
        }
    }, [searchParams])

    const handleClose = () => {
        setDialogOpen(false)
        router.replace("/affiliation/payment")
    }

    return (
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogContent className="sm:max-w-sm border-none shadow-2xl p-8">
                <div className="flex flex-col items-center text-center space-y-6">
                    {/* Icon with subtle ring */}
                    <div
                        className={`
              relative flex h-14 w-14 items-center justify-center rounded-full
              ${status === "success" ? "bg-emerald-50 ring-1 ring-emerald-100" : "bg-red-50 ring-1 ring-red-100"}
            `}
                    >
                        {status === "success" ? (
                            <Check className="h-6 w-6 text-emerald-600" strokeWidth={2.5} />
                        ) : (
                            <X className="h-6 w-6 text-red-600" strokeWidth={2.5} />
                        )}
                    </div>

                    {/* Text content */}
                    <div className="space-y-2">
                        <h2 className="text-lg font-medium tracking-tight text-foreground">
                            {status === "success" ? "Connected" : "Connection Failed"}
                        </h2>
                        <p className="text-sm text-muted-foreground leading-relaxed max-w-[260px]">{message}</p>
                    </div>

                    {/* Single action button */}
                    <Button
                        onClick={handleClose}
                        className={`
              w-full h-11 font-medium transition-all
              ${status === "success"
                                ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                                : "bg-foreground hover:bg-foreground/90 text-background"
                            }
            `}
                    >
                        {status === "success" ? "Continue" : "Try Again"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
