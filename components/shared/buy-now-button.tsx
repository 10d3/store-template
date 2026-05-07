"use client";
import { createCheckoutSessionNow, createGuestCheckoutSessionNow } from "@/lib/cart/checkout-session";
import { Button } from "../ui/button";
import { StripeProduct } from "@/types/product";
import { CreditCard } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useSession } from "@/lib/auth-client";

export default function BuyNowButton({
    product,
}: {
    product: StripeProduct;
}) {

    const [loading, setLoading] = useState(false);
    const [showGuestForm, setShowGuestForm] = useState(false);
    const [guestEmail, setGuestEmail] = useState("");
    const [guestName, setGuestName] = useState("");
    const { data: session } = useSession();

    const getPrice = () => {
        if (
            typeof product.default_price === "object" &&
            product.default_price?.unit_amount
        ) {
            return product.default_price.unit_amount;
        }
        return 0;
    };

    function transformProductDatatoCartItem(product: StripeProduct) {
        return {
            id: product.id,
            name: product.name,
            image: product?.images?.[0] as string,
            price: getPrice(),
            quantity: 1,
            maxQuantity: 10,
            variantId: product.id,
        }
    }

    const generateStripeLink = async () => {
        if (session?.user) {
            try {
                setLoading(true);
                const url = await createCheckoutSessionNow(transformProductDatatoCartItem(product));
                window.location.href = url as string;
            } catch (error: any) {
                toast.error(error.message || "An error occurred during checkout");
                console.error("Error creating checkout session:", error);
            } finally {
                setLoading(false);
            }
        } else {
            setShowGuestForm(true);
        }
    }

    const handleGuestCheckout = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!guestEmail) {
            toast.error("Please enter your email");
            return;
        }
        try {
            setLoading(true);
            const url = await createGuestCheckoutSessionNow(guestEmail, transformProductDatatoCartItem(product), guestName || undefined);
            window.location.href = url as string;
        } catch (error: any) {
            toast.error(error.message || "An error occurred during checkout");
            console.error("Error creating guest checkout session:", error);
        } finally {
            setLoading(false);
        }
    }

    if (showGuestForm) {
        return (
            <form onSubmit={handleGuestCheckout} className="space-y-3">
                <input
                    type="email"
                    placeholder="Email address"
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                    className="w-full px-4 py-3 border rounded-md"
                    required
                />
                <input
                    type="text"
                    placeholder="Name (optional)"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    className="w-full px-4 py-3 border rounded-md"
                />
                <div className="flex gap-2">
                    <Button type="button" variant="outline" onClick={() => setShowGuestForm(false)} className="flex-1">
                        Cancel
                    </Button>
                    <Button type="submit" disabled={loading} className="flex-1 bg-[#73BF44] hover:bg-[#73BF44]/90">
                        {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "Buy Now"}
                    </Button>
                </div>
            </form>
        );
    }

    return (
        <div className="space-y-3" id="button-add-to-cart">
            <Button
                onClick={generateStripeLink}
                disabled={loading}
                className="w-full py-5 bg-[#73BF44] hover:bg-[#73BF44]/90 shadow-lg hover:shadow-xl transition-all duration-300"
            >
                {loading ? (
                    <div className="flex items-center gap-2">
                        <h3>Buy now</h3>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    </div>
                ) : (
                    <div className="flex items-center gap-2">
                        <CreditCard className="w-5 h-5" />
                        <h3>Buy now</h3>
                    </div>
                )}
            </Button>
        </div>
    );
}
