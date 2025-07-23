"use client";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { StripeProduct, StripeCoupon } from "@/types/product";
import { Edit, Archive, Package, ShoppingBag, Percent } from "lucide-react";

interface UnifiedProductListProps {
  products: StripeProduct[];
  coupons: StripeCoupon[];
  onEdit: (product: StripeProduct) => void;
  onArchive: (id: string) => void;
  isLoading?: boolean;
}

export function UnifiedProductList({
  products,
  coupons,
  onEdit,
  onArchive,
  isLoading,
}: UnifiedProductListProps) {
  const [archivingId, setArchivingId] = useState<string | null>(null);

  const handleArchive = async (id: string) => {
    setArchivingId(id);
    await onArchive(id);
    setArchivingId(null);
  };

  const formatPrice = (amount: number, currency: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  };

  const formatDiscount = (coupon: StripeCoupon) => {
    if (coupon.percent_off && coupon.percent_off > 0) {
      return `${coupon.percent_off}% off`;
    }
    if (coupon.amount_off && coupon.amount_off > 0 && coupon.currency) {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: coupon.currency.toUpperCase(),
      }).format(coupon.amount_off / 100);
    }
    return "Special offer";
  };

  const regularProducts = products.filter((p) => p.metadata?.type !== "bundle");
  const packProducts = products.filter((p) => p.metadata?.type === "bundle");

  return (
    <Card>
      <CardHeader>
        <CardTitle>Store Inventory</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="products" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="products" className="flex items-center gap-2">
              <ShoppingBag className="h-4 w-4" />
              Products ({regularProducts.length})
            </TabsTrigger>
            <TabsTrigger value="packs" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Packs ({packProducts.length})
            </TabsTrigger>
            <TabsTrigger value="coupons" className="flex items-center gap-2">
              <Percent className="h-4 w-4" />
              Coupons ({coupons.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="products" className="space-y-3 mt-4">
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
                        {formatPrice(
                          product.default_price.unit_amount,
                          product.default_price.currency
                        )}
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
          </TabsContent>

          <TabsContent value="packs" className="space-y-3 mt-4">
            {packProducts.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No packs found
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
                      <Badge variant="secondary">Pack</Badge>
                      {pack.metadata?.discount &&
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
                    {pack.metadata?.contents && (
                      <p className="text-xs text-muted-foreground">
                        Contains: {pack.metadata.contents.split(",").length}{" "}
                        items
                      </p>
                    )}
                    {pack.default_price && (
                      <p className="text-sm font-medium">
                        {formatPrice(
                          pack.default_price.unit_amount,
                          pack.default_price.currency
                        )}
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
          </TabsContent>

          <TabsContent value="coupons" className="space-y-3 mt-4">
            {coupons.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No coupons found
              </p>
            ) : (
              coupons.map((coupon) => (
                <div
                  key={coupon.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium truncate">
                        {coupon.name || coupon.id}
                      </h3>
                      <Badge variant={coupon.valid ? "default" : "secondary"}>
                        {coupon.valid ? "Active" : "Inactive"}
                      </Badge>
                      {coupon.metadata?.type && (
                        <Badge variant="outline">{coupon.metadata.type}</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Duration: {coupon.duration}
                    </p>
                    {coupon.metadata?.description && (
                      <p className="text-xs text-muted-foreground">
                        {coupon.metadata.description}
                      </p>
                    )}
                  </div>
                  <div className="ml-4">
                    <Badge variant="outline">{formatDiscount(coupon)}</Badge>
                  </div>
                </div>
              ))
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
