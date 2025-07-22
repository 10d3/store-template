"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Percent } from "lucide-react";
import type { StripeCoupon } from "@/types/product";

interface CouponListProps {
  coupons: StripeCoupon[];
}

export function CouponList({ coupons }: CouponListProps) {
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
    return "Unknown discount";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Percent className="h-5 w-5" />
          Coupons ({coupons.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {coupons.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            No coupons found
          </p>
        ) : (
          <div className="space-y-3">
            {coupons.map((coupon) => (
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
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Duration: {coupon.duration}
                  </p>
                </div>
                <div className="ml-4">
                  <Badge variant="outline">{formatDiscount(coupon)}</Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
