/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { templates } from "@/lib/og";
import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Get template name (default to minimal-blog)
    const templateName = searchParams.get("template") || "minimal-blog";
    const Template = templates[templateName];

    if (!Template) {
      return new Response(`Template "${templateName}" not found`, {
        status: 404,
      });
    }

    // Parse all possible parameters
    const image1 = searchParams.get("image1") || searchParams.get("image");
    const image2 = searchParams.get("image2");
    const image3 = searchParams.get("image3");

    // Build images array from individual params
    const imagesArray = [image1, image2, image3].filter(Boolean) as string[];

    const props = {
      title: searchParams.get("title") || "Untitled Blog Post",
      description: searchParams.get("description") || undefined,
      author: searchParams.get("author") || undefined,
      date: searchParams.get("date") || undefined,
      readingTime: searchParams.get("readingTime") || undefined,
      category: searchParams.get("category") || undefined,
      tags: searchParams.get("tags")?.split(",") || undefined,
      image: image1 || undefined,
      images: imagesArray.length > 0 ? imagesArray : undefined,
      logo: searchParams.get("logo") || undefined,
      accentColor: searchParams.get("accentColor") || undefined,
      bgColor: searchParams.get("bgColor") || undefined,
    };

    return new ImageResponse(<Template {...props} />, {
      width: 1200,
      height: 630,
    });
  } catch (e: any) {
    console.log(`${e.message}`);
    return new Response(`Failed to generate the image: ${e.message}`, {
      status: 500,
    });
  }
}
