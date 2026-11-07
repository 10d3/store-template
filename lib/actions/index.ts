"use server"
import { prisma } from "../prisma";
import { headers } from "next/headers";
import { auth } from "../auth";

export const fsindBlog = async (id: string | undefined) => {
  if (!id) {
    return null;
  }
  try {
    const blog = await prisma.blog.findUnique({
      where: { id },
    });
    return blog;
  } catch (error) {
    console.error(error);
  }
};

export const findBlogs = async () => {
  try {
    const blogs = await prisma.blog.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });
    return blogs;
  } catch (error) {
    console.error(error);
    return undefined;
  }
};

export const findBlogBySlugWithoutView = async (slug: string) => {
  try {
    const blog = await prisma.blog.findUnique({
      where: { slug },
    });
    return blog;
  } catch (error) {
    console.error(error);
    return null;
  }
};


export const findBlogBySlug = async (
  slug: string,
  viewerIdentifier: string // Add viewerIdentifier parameter
) => {
  try {
    const blog = await prisma.blog.findUnique({
      where: { slug },
    });

    if (blog) {
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

      const existingView = await prisma.blogView.findFirst({
        where: {
          blogId: blog.id,
          viewerIdentifier: viewerIdentifier,
          createdAt: {
            gte: twentyFourHoursAgo,
          },
        },
      });

      if (!existingView) {
        // Increment views and create a new BlogView record
        await prisma.blog.update({
          where: { id: blog.id },
          data: {
            views: {
              increment: 1,
            },
          },
        });

        await prisma.blogView.create({
          data: {
            blogId: blog.id,
            viewerIdentifier: viewerIdentifier,
          },
        });
      }
    }
    return blog;
  } catch (error) {
    console.error(error);
    return null;
  }
};

export const publishBlog = async (id: string) => {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (session?.user?.role !== "admin") {
      throw new Error("Unauthorized");
    }

    await prisma.blog.update({
      where: { id },
      data: {
        published: true,
      },
    });
  } catch (error) {
    console.error(error);
  }
};
