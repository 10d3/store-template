"use server";

import { headers } from "next/headers";
import { auth } from "../auth";
import { Blog } from "../generated/prisma";
import { redirect } from "next/navigation";
import { prisma } from "../prisma";

type SaveBlogInput = {
  id?: string; // Make id optional
  title: string;
  slug: string;
  coverImage: string | null;
  content: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  authorId: string;
};

export async function saveToDB(
  value: SaveBlogInput
): Promise<Blog | undefined> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");
  if (session.user.role !== "admin")
    throw new Error("Authorization required to make blog content");

  try {
    const blog = await prisma.blog.upsert({
      where: { id: value.id },
      update: value,
      create: value,
    });

    return blog;
  } catch (error) {
    console.error(error);
  }
}
