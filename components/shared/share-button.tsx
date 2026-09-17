"use client";

import { Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface ShareButtonProps {
  title?: string;
  text?: string;
}

export default function ShareButton({ title, text }: ShareButtonProps) {
  const handleShare = async () => {
    const url = window.location.href;
    const shareData = {
      title: title ?? document.title,
      text,
      url,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        return;
      }
      // Fallback: copy link to clipboard
      await navigator.clipboard.writeText(url);
      toast("Link copied", {
        description: "Product link copied to your clipboard.",
      });
    } catch (error) {
      // User dismissed the share sheet — not an error worth surfacing
      if (error instanceof DOMException && error.name === "AbortError") return;
      try {
        await navigator.clipboard.writeText(url);
        toast("Link copied", {
          description: "Product link copied to your clipboard.",
        });
      } catch {
        toast.error("Couldn't share", {
          description: "Please copy the URL from your browser's address bar.",
        });
      }
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      className="rounded-full"
      onClick={handleShare}
      aria-label="Share this product"
    >
      <Share2 className="w-5 h-5" />
    </Button>
  );
}
