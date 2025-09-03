"use client";

import { useState, useEffect } from "react";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  addToWishlist,
  removeFromWishlist,
  getWishlist,
} from "@/lib/wishlist/crud";
import { toast } from "sonner";

interface WishlistButtonProps {
  productId: string;
}

export default function WishlistButton({ productId }: WishlistButtonProps) {
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const checkWishlistStatus = async () => {
      try {
        const wishlist = await getWishlist();
        setIsInWishlist(wishlist?.wishlist?.productId.includes(productId) ?? false);
      } catch (error) {
        console.error("Error checking wishlist status:", error);
      }
    };

    checkWishlistStatus();
  }, [productId]);

  const handleWishlistToggle = async () => {
    try {
      setIsLoading(true);

      if (isInWishlist) {
        await removeFromWishlist(productId);
        toast("Removed from wishlist", {
          description: "The item has been removed from your wishlist.",
          // action: {
          //   label: "Undo",
          //   onClick: async () => addToWishlist(productId),
          // },
        });
      } else {
        await addToWishlist(productId);
        toast("Added to wishlist", {
          description: "The item has been added to your wishlist.",
          // action: {
          //   label: "Undo",
          //   onClick: async () => removeFromWishlist(productId),
          // },
        });
      }

      setIsInWishlist(!isInWishlist);
    } catch (error) {
      toast( "Error",{
        description: "Please sign in to manage your wishlist.",
      });
      console.log(error)
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      className="rounded-full"
      onClick={handleWishlistToggle}
      disabled={isLoading}
    >
      <Heart
        className={`w-5 h-5 transition-colors ${isInWishlist ? "fill-current text-red-500" : ""}`}
      />
    </Button>
  );
}
