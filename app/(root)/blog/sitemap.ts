// sitemap.ts
import { findBlogs } from "@/lib/action";
import { getBaseURL } from "@/lib/utils";
import type { MetadataRoute } from "next";

// Main function to generate a sitemap
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Make sure the environment variable is defined
  const blogs = await findBlogs();

  // Generate the sitemap entries
  return (blogs ?? []).map((blog) => ({
    url: `${getBaseURL()}/blog/${blog.slug}`,
    lastModified: blog.updatedAt,
  }));
}
