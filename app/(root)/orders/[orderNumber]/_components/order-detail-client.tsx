"use client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Order } from "@/lib/generated/prisma";
import {
  Package,
  Truck,
  Clock,
  CheckCircle,
  MapPin,
  Mail,
} from "lucide-react";
import Image from "next/image";

interface OrderDetailClientProps {
  order: Order;
}

const statusConfig = {
  DELIVERED: {
    icon: CheckCircle,
    variant: "default" as const,
    color: "text-green-600",
    bgColor: "bg-green-50 border-green-200",
  },
  PROCESSING: {
    icon: Clock,
    variant: "secondary" as const,
    color: "text-amber-600",
    bgColor: "bg-amber-50 border-amber-200",
  },
  SHIPPED: {
    icon: Truck,
    variant: "outline" as const,
    color: "text-blue-600",
    bgColor: "bg-blue-50 border-amber-200",
  },
  completed: {
    icon: CheckCircle,
    variant: "default" as const,
    color: "text-green-600",
    bgColor: "bg-green-50 border-green-200",
  },
  failed: {
    icon: Package,
    variant: "destructive" as const,
    color: "text-red-600",
    bgColor: "bg-red-50 border-red-200",
  },
};

export default function OrderDetailClient({ order }: OrderDetailClientProps) {
  const statusInfo =
    statusConfig[order.status as keyof typeof statusConfig] ||
    statusConfig.PROCESSING;
  const StatusIcon = statusInfo.icon;
  const lineItems = order.lineItems as Array<{
    price_data?: {
      product_data?: {
        name?: string;
        images?: string[];
      };
      unit_amount?: number;
    };
    quantity?: number;
    name?: string;
    image?: string;
  }>;
  
  const shippingAddress = order.shippingAddress
    ? JSON.parse(order.shippingAddress as string)
    : null;

  return (
    <div className="min-h-screen">
      <div className="container mx-auto py-4 md:py-12">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-2">
              <h1 className="text-4xl font-bold tracking-tight">
                Order #{order.orderNumber}
              </h1>
              <p className="text-muted-foreground">
                Placed on{" "}
                {new Date(order.createdAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
            <Badge
              variant={statusInfo.variant}
              className={`${statusInfo.bgColor} ${statusInfo.color} border-0 px-4 py-2 font-medium text-base`}
            >
              <StatusIcon className="w-4 h-4 mr-2" />
              {order.status.toUpperCase()}
            </Badge>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <Card className="md:col-span-2 border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-xl">Items</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {lineItems.map((item, index) => (
                  <div key={index}>
                    <div className="flex items-center gap-4">
                      <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-muted">
                        <Image
                          width={200}
                          height={200}
                          src={
                            item.price_data?.product_data?.images?.[0] ||
                            item.image ||
                            "/placeholder.svg"
                          }
                          alt={item.price_data?.product_data?.name || item.name || "Product"}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold truncate">
                          {item.price_data?.product_data?.name || item.name || "Product"}
                        </h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          Qty: {item.quantity || 1}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">
                          $
                          {(
                            ((item.price_data?.unit_amount || 0) / 100) *
                            (item.quantity || 1)
                          ).toFixed(2)}
                        </p>
                      </div>
                    </div>
                    {index < lineItems.length - 1 && <Separator className="mt-4" />}
                  </div>
                ))}
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-xl">Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>${order.total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Shipping</span>
                    <span>Free</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Total</span>
                    <span>${order.total.toFixed(2)}</span>
                  </div>
                </CardContent>
              </Card>

              {shippingAddress && (
                <Card className="border-0 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-xl flex items-center gap-2">
                      <MapPin className="w-5 h-5" />
                      Shipping Address
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm space-y-1">
                    {shippingAddress.name && (
                      <p className="font-medium">{shippingAddress.name}</p>
                    )}
                    {shippingAddress.line1 && <p>{shippingAddress.line1}</p>}
                    {shippingAddress.line2 && <p>{shippingAddress.line2}</p>}
                    <p>
                      {[shippingAddress.city, shippingAddress.state, shippingAddress.postal_code]
                        .filter(Boolean)
                        .join(", ")}
                    </p>
                    {shippingAddress.country && <p>{shippingAddress.country}</p>}
                  </CardContent>
                </Card>
              )}

              {order.customerEmail && (
                <Card className="border-0 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-xl flex items-center gap-2">
                      <Mail className="w-5 h-5" />
                      Contact
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm">
                    <p>{order.customerEmail}</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          <div className="flex justify-center pt-4">
            <Button variant="outline" asChild>
              <a href="/orders">View All Orders</a>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
