"use client";
import { createCheckoutSessionNow, createGuestCheckoutSessionNow } from "@/lib/cart/checkout-session";
import { Button } from "@/components/ui/button";
import { type ProductWithVariants } from "@/lib/catalog";
import { CreditCard } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useSession } from "@/lib/auth-client";
import { useCartStore } from "@/lib/store";

export default function BuyNowButton({
  product,
}: {
  product: ProductWithVariants;
}) {
  const [loading, setLoading] = useState(false);
  const { data: session } = useSession();
  const coupon = useCartStore((s) => s.coupon);

  const getPrice = () => {
    return product.defaultVariant?.price ?? product.variants?.[0]?.price ?? 0;
  };

  function transformProductDatatoCartItem(product: ProductWithVariants) {
    const resolvedVariantId =
      product.defaultVariant?.id ?? product.variants?.[0]?.id;

    if (!resolvedVariantId) {
      console.error(
        `BuyNowButton: no variant available for product ${product.id}`
      );
      return null;
    }

    return {
      id: product.id,
      name: product.name,
      image: product?.images?.[0] as string,
      price: getPrice(),
      quantity: 1,
      maxQuantity: 10,
      variantId: resolvedVariantId,
    };
  }

  const generateStripeLink = async () => {
    const item = transformProductDatatoCartItem(product);
    if (!item) return;
    try {
      setLoading(true);
      if (session?.user) {
        const url = await createCheckoutSessionNow(item, coupon?.id);
        window.location.href = url as string;
      } else {
        const url = await createGuestCheckoutSessionNow(item, undefined, coupon?.id);
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
