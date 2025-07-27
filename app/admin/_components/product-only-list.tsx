/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Edit, Archive } from "lucide-react";
import { StripeProduct } from "@/types/product";

interface ProductOnlyListProps {
  products: StripeProduct[];
  onEdit: (product: StripeProduct) => void;
  onArchive: (id: string) => void;
  isLoading?: boolean;
  title?: string;
  description?: string;
}

export function ProductOnlyList({
  products,
  onEdit,
  onArchive,
  isLoading,
  title = "Products",
  description,
}: ProductOnlyListProps) {
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

  // Filter to show only regular products (not bundles)
  const regularProducts = products.filter((p) => p.metadata && p.metadata.type !== "bundle");

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
          {regularProducts.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No products found
            </p>
          ) : (
            regularProducts.map((product) => (
              <div
                key={product.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium truncate">{product.name}</h3>
                    <Badge variant="outline">Product</Badge>
                  </div>
                  {product.description && (
                    <p className="text-sm text-muted-foreground truncate">
                      {product.description}
                    </p>
                  )}
                  {product.default_price && (
                    <p className="text-sm font-medium">
                      {formatPrice(product.default_price)}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(product)}
                    disabled={isLoading}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleArchive(product.id)}
                    disabled={archivingId === product.id || isLoading}
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