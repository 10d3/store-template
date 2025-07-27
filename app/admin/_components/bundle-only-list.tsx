/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Edit, Archive } from "lucide-react";
import { StripeProduct } from "@/types/product";
// import { StripeProduct } from "@/types/stripe";

interface BundleOnlyListProps {
  products: StripeProduct[];
  onEdit: (product: StripeProduct) => void;
  onArchive: (id: string) => void;
  isLoading?: boolean;
  title?: string;
  description?: string;
}

export function BundleOnlyList({
  products,
  onEdit,
  onArchive,
  isLoading,
  title = "Bundles",
  description,
}: BundleOnlyListProps) {
  const [archivingId, setArchivingId] = useState<string | null>(null);

  const handleArchive = async (id: string) => {
    setArchivingId(id);
    try {
      await onArchive(id);
    } finally {
      setArchivingId(null);
    }
  };

  const formatPrice = (price: any) => {
    if (!price || typeof price !== "object") return "N/A";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: price.currency?.toUpperCase() || "USD",
    }).format((price.unit_amount || 0) / 100);
  };

  // Filter to show only bundles/packs
  const packProducts = products.filter((p) => p.metadata && p.metadata.type === "bundle");

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {packProducts.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No bundles found
            </p>
          ) : (
            packProducts.map((pack) => (
              <div
                key={pack.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium truncate">{pack.name}</h3>
                    <Badge variant="secondary">Bundle</Badge>
                    {pack.metadata && pack.metadata.discount &&
                      Number.parseInt(pack.metadata.discount) > 0 && (
                        <Badge variant="destructive">
                          {pack.metadata.discount}% off
                        </Badge>
                      )}
                  </div>
                  {pack.description && (
                    <p className="text-sm text-muted-foreground truncate">
                      {pack.description}
                    </p>
                  )}
                  {pack.metadata && pack.metadata.contents && (
                    <p className="text-xs text-muted-foreground">
                      Contains: {pack.metadata.contents.split(",").length}{" "}
                      items
                    </p>
                  )}
                  {pack.default_price && (
                    <p className="text-sm font-medium">
                      {formatPrice(pack.default_price)}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(pack)}
                    disabled={isLoading}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleArchive(pack.id)}
                    disabled={archivingId === pack.id || isLoading}
                  >
                    <Archive className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}