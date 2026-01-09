import CartModal from "@/components/shared/cart/cart-modal";
import Footer from "@/components/footer";
import FooterWrapperCta from "@/components/shared/footer-wrapper-cta";
import Navbar, { Category } from "@/components/shared/nav/navigation-menu";
import SocialProofProvider from "@/components/shared/social-proof-provider";
import { listProducts } from "@/lib/product/crud";
import { Metadata } from "next";
import React from "react";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Vitanou | Supplements for a Grounded Life",
  description: "Holistic health for body and mind. Clean formulas to restore your inner connection. Honesty, purity, and vitality in every dose.",
  keywords: [
    "holistic wellness supplements",
    "clean label vitamins",
    "grounded living health",
    "mind-body balance formulas",
    "transparent ingredient supplements",
    "restorative health vitamins",
    "additive-free supplements",
    "natural vitality boosters",
    "ethical supplement brands",
    "inner connection wellness",
    "high-potency clean formulas",
    "natural stress relief grounding",
    "bioavailable plant-based vitamins",
    "mental clarity supplements",
    "sustainable health products"
  ],
  creator: "Dr Ricardo Roselyn"
};

export default async function Rootlayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const products = await listProducts();

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const isAdmin = session?.user?.role === "admin";
  let isAffiliate = false;

  if (session?.user?.id) {
    const affiliate = await prisma.affiliate.findUnique({
      where: { userId: session.user.id },
      select: { status: true },
    });
    isAffiliate = affiliate?.status === "ACTIVE";
  }

  // Extract unique categories and target audiences
  const categoryMap = new Map<string, Category>();

  // Helper to capitalize
  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

  // First, look for Gender/Target Audience to prioritize them
  products.forEach((product) => {
    const gender = product.metadata?.gender?.toLowerCase();
    if (gender) {
      const slug = gender;
      if (!categoryMap.has(slug)) {
        let title = capitalize(slug);
        let description = `Shop for ${slug}`;

        if (slug === "men") {
          title = "Men's Fashion";
          description = "Discover the latest trends in men's clothing";
        } else if (slug === "women") {
          title = "Women's Fashion";
          description = "Explore our curated collection of women's fashion";
        }

        categoryMap.set(slug, {
          title: title,
          href: `/search?gender=${slug}`,
          description: description,
        });
      }
    }
  });

  // Then look for other categories
  products.forEach((product) => {
    const category = product.metadata?.category;
    if (category) {
      const slug = category.toLowerCase().replace(/\s+/g, "-");
      // Avoid overwriting gender categories if they clash (unlikely given naming)
      if (!categoryMap.has(slug)) {
        categoryMap.set(slug, {
          title: capitalize(category),
          href: `/category/${slug}`,
          description: `Browse our ${category} collection`,
        });
      }
    }
  });

  const shopCategories = Array.from(categoryMap.values());

  // Transform products for social proof notifications
  const socialProofProducts = products
    .filter((p) => p.images && p.images.length > 0)
    .map((p) => ({
      name: p.name,
      image: p.images?.[0] || "/placeholder.svg",
    }));

  return (
    <>
      <Navbar shopCategories={shopCategories} isAdmin={isAdmin} isAffiliate={isAffiliate} />
      <main className="flex-1 flex-col mt-4 md:px-24 px-4">
        {children}
        <CartModal />
        <SocialProofProvider
          products={socialProofProducts}
          position="bottom-left"
          intervalMin={20000}
          intervalMax={45000}
        />
      </main>
      <FooterWrapperCta>
        <Footer />
      </FooterWrapperCta>
    </>
  );
}
