"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "../auth";
import { headers } from "next/headers";
import { getProductsByProductIds } from "../product/crud";

export async function addToWishlist(productId: string) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
      throw new Error("User not authenticated");
    }

    const userId = session.user.id;
    const existingWishlist = await prisma.wishlist.findFirst({
      where: { userId },
    });

    if (existingWishlist) {
      // Add product to existing wishlist if not already present
      if (!existingWishlist.productId.includes(productId)) {
        await prisma.wishlist.update({
          where: { id: existingWishlist.id },
          data: {
            productId: [...existingWishlist.productId, productId],
            updatedAt: new Date(),
          },
        });
      }
      return existingWishlist;
    }

    // Create new wishlist if none exists
    const wishlist = await prisma.wishlist.create({
      data: {
        id: `wl_${userId}_${Date.now()}`,
        userId,
        productId: [productId],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    return wishlist;
  } catch (error) {
    console.error("Error adding to wishlist:", error);
    throw new Error("Failed to add to wishlist");
  }
}

export async function removeFromWishlist(productId: string) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
      throw new Error("User not authenticated");
    }

    const userId = session.user.id;
    const existingWishlist = await prisma.wishlist.findFirst({
      where: { userId },
    });

    if (!existingWishlist) {
      throw new Error("Wishlist not found");
    }

    await prisma.wishlist.update({
      where: { id: existingWishlist.id },
      data: {
        productId: existingWishlist.productId.filter((id) => id !== productId),
        updatedAt: new Date(),
      },
    });

    return existingWishlist;
  } catch (error) {
    console.error("Error removing from wishlist:", error);
    throw new Error("Failed to remove from wishlist");
  }
}

export async function getWishlist() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
      return null;
    }

    const wishlist = await prisma.wishlist.findFirst({
      where: { userId: session.user.id },
    });

    const products = await getProductsByProductIds(
      wishlist?.productId as string[]
    );

    return {
      wishlist,
      products,
    };
  } catch (error) {
    console.error("Error fetching wishlist:", error);
    throw new Error("Failed to fetch wishlist");
  }
}
