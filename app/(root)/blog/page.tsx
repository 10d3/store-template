import { findBlogs } from "@/lib/action";
import React from "react";
import { BlogHeader } from "./_components/blog-header";
import { BlogGrid } from "./_components/blog-grid";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog | Our Store",
  description: "Read our latest articles, guides, and news. Stay updated with tips, product insights, and industry trends.",
  openGraph: {
    title: "Blog | Our Store",
    description: "Read our latest articles, guides, and news. Stay updated with tips, product insights, and industry trends.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Blog | Our Store",
    description: "Read our latest articles, guides, and news. Stay updated with tips, product insights, and industry trends.",
  },
};

export default async function page() {
  const blogs = await findBlogs();

  return (
    <main className="min-h-screen bg-background">
      <BlogHeader />
      <BlogGrid blogs={blogs} />
    </main>
  );
}
