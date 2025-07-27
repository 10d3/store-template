"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Edit } from "lucide-react";
import { StripeCoupon } from "@/types/product";

interface CouponOnlyListProps {
  coupons: StripeCoupon[];
  onEdit: (coupon: StripeCoupon) => void;
  isLoading?: boolean;
  title?: string;
  description?: string;
}

export function CouponOnlyList({
  coupons,
  onEdit,
  isLoading,
  title = "Coupons",
  description,
}: CouponOnlyListProps) {
  const formatDiscount = (coupon: StripeCoupon) => {
    if (coupon.percent_off) {
      return `${coupon.percent_off}% off`;
    }
    if (coupon.amount_off && coupon.currency) {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: coupon.currency.toUpperCase(),
      }).format(coupon.amount_off / 100);
    }
    return "Special offer";
  };

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
          {coupons.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No coupons found
            </p>
          ) : (
            coupons.map((coupon) => (
              <div
                key={coupon.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium truncate">
                      {coupon.name || coupon.id}
                    </h3>
                    <Badge variant={coupon.valid ? "default" : "secondary"}>
                      {coupon.valid ? "Active" : "Inactive"}
                    </Badge>
                    {coupon.metadata && coupon.metadata.type && (
                      <Badge variant="outline">{coupon.metadata.type}</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {formatDiscount(coupon)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Duration: {coupon.duration}
                  </p>
                  {coupon.metadata && coupon.metadata.description && (
                    <p className="text-xs text-muted-foreground">
                      {coupon.metadata.description}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(coupon)}
                    disabled={isLoading}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Badge variant="outline">{formatDiscount(coupon)}</Badge>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}