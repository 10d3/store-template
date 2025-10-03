'use client';

import { Button } from "@/components/ui/button";
import { Check, Copy } from "lucide-react";
import { useState } from "react";

interface CopyLinkButtonProps {
  productId: string;
  link: string;
}

export function CopyLinkButton({ productId, link }: CopyLinkButtonProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyLink = (id: string, linkToCopy: string) => {
    navigator.clipboard.writeText(linkToCopy);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <Button
      size="sm"
      variant="ghost"
      onClick={() => handleCopyLink(productId, link)}
      className="h-8 w-8 flex-shrink-0 p-0"
    >
      {copiedId === productId ? (
        <Check className="h-4 w-4 text-primary" />
      ) : (
        <Copy className="h-4 w-4" />
      )}
    </Button>
  );
}