import { getBaseURL } from "@/lib/utils";
import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getBaseURL();
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: "/admin/",
      },
    ],
    sitemap: [`${baseUrl}/sitemap.xml`, `${baseUrl}/blog/sitemap.xml`],
  };
}
