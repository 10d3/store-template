/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import {
  Package,
  Download,
  Truck,
  Clock,
  CheckCircle,
  ShoppingBag,
} from "lucide-react";
import Image from "next/image";
import { Order } from "@/lib/generated/prisma";

interface OrdersClientPageProps {
  orders: Order[];
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
    bgColor: "bg-blue-50 border-blue-200",
  },
};

export default function OrdersClientPage({ orders }: OrdersClientPageProps) {
  return (
    <div className="min-h-screen">
      <div className="container mx-auto py-4 md:py-12">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 mb-12">
            <div className="space-y-2">
              <h1 className="text-4xl font-bold tracking-tight">
                Order History
              </h1>
              <p className="text-lg">
                Track and manage all your orders in one place
              </p>
            </div>
            <Button
              variant="outline"
              className="self-start sm:self-auto"
            >
              <Download className="w-4 h-4 mr-2" />
              Download All Invoices
            </Button>
          </div>

          {orders.length === 0 ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="py-16">
                <div className="flex flex-col items-center text-center space-y-6">
                  <div className="w-20 h-20 rounded-full flex items-center justify-center">
                    <Package className="w-10 h-10" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-semibold">
                      No orders yet
                    </h3>
                    <p className="max-w-md">
                      When you place your first order, it will appear here for
                      easy tracking and management.
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
            <div className="space-y-8">
              {orders.map((order) => {
                const statusInfo =
                  statusConfig[order.status as keyof typeof statusConfig] ||
                  statusConfig.PROCESSING;
                const StatusIcon = statusInfo.icon;
                const lineItems = order.lineItems as any[];

                return (
                  <Card
                    key={order.id}
                    className="border-0 shadow-sm hover:shadow-md transition-all duration-200"
                  >
                    <CardHeader className="pb-4">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                        <div className="space-y-3">
                          <CardTitle className="text-2xl font-semibold">
                            Order #{(order as any).orderNumber || order.id.slice(-8)}
                          </CardTitle>
                          <div className="flex flex-wrap items-center gap-6 text-sm">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">Date:</span>
                              <span>
                                {new Date(order.createdAt).toLocaleDateString(
                                  "en-US",
                                  {
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                  }
                                )}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">Items:</span>
                              <span>{lineItems.length}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">Total:</span>
                              <span className="font-semibold">
                                ${order.total.toFixed(2)}
                              </span>
                            </div>
                          </div>
                        </div>
                        <Badge
                          variant={statusInfo.variant}
                          className={`${statusInfo.bgColor} ${statusInfo.color} border-0 px-3 py-1.5 font-medium`}
                        >
                          <StatusIcon className="w-3.5 h-3.5 mr-1.5" />
                          {order.status}
                        </Badge>
                      </div>
                    </CardHeader>

                    <CardContent className="pt-0">
                      <div className="space-y-6">
                        <div className="space-y-4">
                          {lineItems.map((item: any, index: number) => (
                            <div key={index}>
                              <div className="flex items-center gap-4">
                                <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0">
                                  <Image
                                    width={1000}
                                    height={1000}
                                    src={item.price_data.product_data.images[0] || "/placeholder.svg"}
                                    alt={item.price_data.product_data.name}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-semibold truncate">
                                    {item.price_data.product_data.name}
                                  </h4>
                                  <p className="text-sm mt-1">
                                    Quantity: {item.quantity}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="font-semibold">
                                    ${((item.price_data.unit_amount as number / 100) * item.quantity).toFixed(2)}
                                  </p>
                                </div>
                              </div>
                              {index < lineItems.length - 1 && (
                                <Separator className="mt-4" />
                              )}
                            </div>
                          ))}
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3 sm:justify-end pt-4 border-t">
                          <Button
                            variant="outline"
                            size="sm"
                          >
                            <Truck className="w-4 h-4 mr-2" />
                            Track Order
                          </Button>
                          {/* <Button
                            variant="outline"
                            size="sm"
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Download Invoice
                          </Button> */}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
