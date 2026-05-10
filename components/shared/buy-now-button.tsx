"use client";
import { createCheckoutSessionNow, createGuestCheckoutSessionNow } from "@/lib/cart/checkout-session";
import { Button } from "@/components/ui/button";
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
    };
  }

  const generateStripeLink = async () => {
    try {
      setLoading(true);
      if (session?.user) {
        const url = await createCheckoutSessionNow(transformProductDatatoCartItem(product));
        window.location.href = url as string;
      } else {
        const url = await createGuestCheckoutSessionNow(transformProductDatatoCartItem(product));
        window.location.href = url as string;
      }
    } catch (error: any) {
      toast.error(error.message || "An error occurred during checkout");
      console.error("Error creating checkout session:", error);
    } finally {
      setLoading(false);
    }
  };

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
