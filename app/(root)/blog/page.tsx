import { findBlogs } from "@/lib/action";
import React from "react";
import { BlogHeader } from "./_components/blog-header";
import { BlogGrid } from "./_components/blog-grid";

export default async function page() {
  const blogs = await findBlogs();
  console.log(blogs)
  return (
    <main className="min-h-screen bg-background">
      <BlogHeader />
      <BlogGrid blogs={blogs} />
    </main>
  );
}
