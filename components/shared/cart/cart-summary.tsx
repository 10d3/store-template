"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Info } from "lucide-react";
import Image from "next/image";

interface CartItem {
  id: string;
  name: string;
  category: string;
  price: number;
  quantity: number;
  image: string;
}

interface CartSummaryProps {
  items: CartItem[];
  shippingCost: number;
  onContinueToPayment: () => void;
}

export function CartSummary({
  items,
  shippingCost,
  onContinueToPayment,
}: CartSummaryProps) {
  const [discountCode, setDiscountCode] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState(0);

  const subtotal = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const estimatedTaxes = 5.0;
  const total = subtotal + shippingCost + estimatedTaxes - appliedDiscount;

  const handleApplyDiscount = () => {
    // Simple discount logic - in real app, this would call an API
    if (discountCode.toLowerCase() === "save10") {
      setAppliedDiscount(subtotal * 0.1);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
      className="sticky top-8"
    >
      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-foreground">
            Your Cart
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Cart Items */}
          <div className="space-y-4">
            {items.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + index * 0.1 }}
                className="flex items-center space-x-4"
              >
                <div className="relative">
                  <Image
                    width={1000}
                    height={1000}
                    src={item.image || "/placeholder.svg"}
                    alt={item.name}
                    className="w-16 h-16 object-cover rounded-lg"
                  />
                  <Badge
                    variant="secondary"
                    className="absolute -top-2 -right-2 w-6 h-6 rounded-full p-0 flex items-center justify-center text-xs"
                  >
                    {item.quantity}
                  </Badge>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-foreground truncate">
                    {item.name}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {item.category}
                  </p>
                </div>
                <div className="text-lg font-semibold text-foreground">
                  ${item.price.toFixed(2)}
                </div>
              </motion.div>
            ))}
          </div>

          <Separator />

          {/* Discount Code */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="space-y-2"
          >
            <div className="flex space-x-2">
              <Input
                placeholder="Discount code"
                value={discountCode}
                onChange={(e) => setDiscountCode(e.target.value)}
                className="bg-input border-border focus:ring-primary focus:border-primary"
              />
              <Button
                onClick={handleApplyDiscount}
                variant="outline"
                className="px-6 bg-transparent"
              >
                Apply
              </Button>
            </div>
            {appliedDiscount > 0 && (
              <p className="text-sm text-accent font-medium">
                Discount applied: -${appliedDiscount.toFixed(2)}
              </p>
            )}
          </motion.div>

          <Separator />

          {/* Order Summary */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="space-y-3"
          >
            <div className="flex justify-between text-foreground">
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-foreground">
              <span>Shipping</span>
              <span>${shippingCost.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-foreground">
              <span className="flex items-center space-x-1">
                <span>Estimated taxes</span>
                <Info className="w-4 h-4 text-muted-foreground" />
              </span>
              <span>${estimatedTaxes.toFixed(2)}</span>
            </div>
            {appliedDiscount > 0 && (
              <div className="flex justify-between text-accent">
                <span>Discount</span>
                <span>-${appliedDiscount.toFixed(2)}</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between text-lg font-semibold text-foreground">
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </motion.div>

          {/* Continue Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Button
              onClick={onContinueToPayment}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-3 text-base font-medium"
              size="lg"
            >
              Continue to Payment
            </Button>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
