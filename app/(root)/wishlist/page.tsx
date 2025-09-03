import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getWishlist } from "@/lib/wishlist/crud";
import WishlistClientPage from "./_components/wishlist-client";
import { StripeProduct } from "@/types/product";

export const metadata = {
  title: "Wishlist",
  description: "View and manage your wishlist items",
};

export default async function WishlistPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user?.id) {
    return <div>Please login to view your wishlist.</div>;
  }

  const wishlistItems = await getWishlist();

  return <WishlistClientPage wishlistItems={wishlistItems?.products as StripeProduct[]} />;
}