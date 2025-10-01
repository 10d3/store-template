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
    const props = {
      title: searchParams.get("title") || "Untitled Blog Post",
      description: searchParams.get("description") || undefined,
      author: searchParams.get("author") || undefined,
      date: searchParams.get("date") || undefined,
      readingTime: searchParams.get("readingTime") || undefined,
      category: searchParams.get("category") || undefined,
      tags: searchParams.get("tags")?.split(",") || undefined,
      image: searchParams.get("image") || undefined,
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
