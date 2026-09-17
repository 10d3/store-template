import type { Metadata } from "next";
import CartPage from "@/components/shared/cart/cart-page";

export const metadata: Metadata = {
    title: "Your Cart | Vitanou",
    description: "Review the items in your cart and proceed to secure checkout.",
};

export default function Cart() {
    return <CartPage />;
}
