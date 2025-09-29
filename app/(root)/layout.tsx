import CartModal from "@/components/shared/cart/cart-modal";
import Footer from "@/components/shared/footer";
import FooterWrapperCta from "@/components/shared/footer-wrapper-cta";
import Navbar from "@/components/shared/nav/navigation-menu";
import { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Vitanou Store",
  description: "",
  keywords: [],
  creator: ""
}

export default function Rootlayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Navbar />
      <main className="flex-1 flex-col mt-4 md:px-24 px-4">
        {children}
        <CartModal />
      </main>
      <FooterWrapperCta>
        <Footer />
      </FooterWrapperCta>
    </>
  );
}
