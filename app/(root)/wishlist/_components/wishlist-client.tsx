"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, ShoppingBag, Trash2 } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { removeFromWishlist } from "@/lib/wishlist/crud";
import { toast } from "sonner";
import { StripeProduct } from "@/types/product";
// import { Product } from "@/lib/generated/prisma";

interface WishlistClientPageProps {
  wishlistItems: StripeProduct[];
}

export default function WishlistClientPage({ wishlistItems }: WishlistClientPageProps) {
  const handleRemoveFromWishlist = async (productId: string) => {
    try {
      await removeFromWishlist(productId);
      toast.success("Item removed from wishlist");
      // Refresh the page to update the wishlist
      window.location.reload();
    } catch (error) {
      toast.error("Failed to remove item from wishlist");
      console.error(error);
    }
  };

  return (
    <div className="min-h-fit">
      <div className="container mx-auto py-4 md:py-12">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 mb-12">
            <div className="space-y-2">
              <h1 className="text-4xl font-bold tracking-tight">
                My Wishlist
              </h1>
              <p className="text-lg text-muted-foreground">
                Save your favorite items for later
              </p>
            </div>
          </div>

          {wishlistItems.length === 0 ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="py-16">
                <div className="flex flex-col items-center text-center space-y-6">
                  <div className="w-20 h-20 rounded-full flex items-center justify-center bg-primary/5">
                    <Heart className="w-10 h-10 text-primary" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-semibold">
                      Your wishlist is empty
                    </h3>
                    <p className="max-w-md text-muted-foreground">
                      Browse our products and add your favorites to your wishlist
                    </p>
                  </div>
                  <Button asChild className="mt-4">
                    <Link href="/" className="inline-flex items-center">
                      <ShoppingBag className="w-4 h-4 mr-2" />
                      Start Shopping
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {wishlistItems.map((item) => (
                <Card
                  key={item.id}
                  className="border-0 shadow-sm hover:shadow-md transition-all duration-200 group"
                >
                  <CardHeader className="">
                    <div className="flex items-start justify-between gap-4">
                      <Link
                        href={`/product/${item.metadata.slug}`}
                        className="flex-1 min-w-0"
                      >
                        <CardTitle className="text-xl font-semibold truncate group-hover:text-primary transition-colors">
                          {item.name}
                        </CardTitle>
                      </Link>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-destructive"
                        onClick={() => handleRemoveFromWishlist(item.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardHeader>

                  <CardContent>
                    <div className="flex gap-6">
                      <Link
                        href={`/product/${item.metadata.slug}`}
                        className="block w-32 h-32 rounded-xl overflow-hidden flex-shrink-0"
                      >
                        <Image
                          width={1000}
                          height={1000}
                          src={item.images?.[0] as string || "/placeholder.svg"}
                          alt={item.name}
                          className="w-full h-full object-cover transition-transform group-hover:scale-105"
                        />
                      </Link>
                      <div className="flex-1 min-w-0 space-y-3">
                        <p className="text-muted-foreground line-clamp-2">
                          {item.description}
                        </p>
                        <div className="flex items-center justify-between">
                          <p className="font-semibold text-lg">
                            ${typeof item.default_price === 'object' && item.default_price?.unit_amount ? (item.default_price.unit_amount / 100).toFixed(2) : '0.00'}
                          </p>
                          <Button asChild size="sm">
                            <Link href={`/product/${item.name}`}>
                              View Details
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}