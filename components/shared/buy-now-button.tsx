"use client";
import { createCheckoutSessionNow } from "@/lib/cart/checkout-session";
import { Button } from "../ui/button";
import { useCartStore } from "@/lib/store";
import { StripeProduct } from "@/types/product";
import { ShoppingCart } from "lucide-react";
import { useState } from "react";

export default function BuyNowButton({
    product,
}: {
    product: StripeProduct;
}) {

    const [loading, setLoading] = useState(false);
    const getPrice = () => {
        if (
            typeof product.default_price === "object" &&
            product.default_price?.unit_amount
        ) {
            return product.default_price.unit_amount;
        }
        return 0; // fallback if no price available
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
        setLoading(true);
        const session = await createCheckoutSessionNow(transformProductDatatoCartItem(product));
        setLoading(false);
        window.location.href = session as string;
    }

    return (
        <div className="space-y-3" id="button-add-to-cart">
            <Button
                onClick={generateStripeLink}
                disabled={loading}
                className="w-full py-4 bg-green-500 hover:bg-green-600 shadow-lg hover:shadow-xl transition-all duration-300"
            >
                {loading ? (
                    <div className="flex items-center gap-2">
                        <h3>Buy now</h3>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    </div>
                ) : (
                    <div className="flex items-center gap-2">
                        <ShoppingCart className="w-5 h-5" />
                        <h3>Buy now</h3>
                    </div>
                )}
            </Button>
        </div>
    );
}
