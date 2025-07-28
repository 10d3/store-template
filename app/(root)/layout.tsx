import CartModal from "@/components/shared/cart/cart-modal";
import Navbar from "@/components/shared/nav/navigation-menu";
import React from "react";

export default function Rootlayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Navbar />
      <main className="flex-1 flex-col mt-4">
        {children}
        <CartModal />
      </main>
    </>
  );
}
