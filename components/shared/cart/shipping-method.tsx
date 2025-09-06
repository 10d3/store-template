"use client";

import type React from "react";

import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Truck, Zap } from "lucide-react";

interface ShippingOption {
  id: string;
  name: string;
  price: number;
  duration: string;
  icon: React.ReactNode;
}

interface ShippingMethodProps {
  onMethodChange: (method: ShippingOption) => void;
}

export function ShippingMethod({ onMethodChange }: ShippingMethodProps) {
  const shippingOptions: ShippingOption[] = [
    {
      id: "free",
      name: "Free Shipping",
      price: 0,
      duration: "7-20 Days",
      icon: <Truck className="w-5 h-5" />,
    },
    {
      id: "express",
      name: "Express Shipping",
      price: 9,
      duration: "1-3 Days",
      icon: <Zap className="w-5 h-5" />,
    },
  ];

  const [selectedMethod, setSelectedMethod] = useState(shippingOptions[0]);

  const handleMethodChange = (methodId: string) => {
    const method = shippingOptions.find((option) => option.id === methodId);
    if (method) {
      setSelectedMethod(method);
      onMethodChange(method);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-foreground">
            Shipping Method
          </CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={selectedMethod.id}
            onValueChange={handleMethodChange}
            className="space-y-4"
          >
            {shippingOptions.map((option, index) => (
              <motion.div
                key={option.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
              >
                <Label
                  htmlFor={option.id}
                  className="flex items-center space-x-4 p-4 border border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                >
                  <RadioGroupItem value={option.id} id={option.id} />
                  <div className="flex items-center space-x-3 flex-1">
                    <div className="text-muted-foreground">{option.icon}</div>
                    <div className="flex-1">
                      <div className="font-medium text-foreground">
                        {option.name}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {option.duration}
                      </div>
                    </div>
                    <div className="text-lg font-semibold text-foreground">
                      ${option.price}
                    </div>
                  </div>
                </Label>
              </motion.div>
            ))}
          </RadioGroup>
        </CardContent>
      </Card>
    </motion.div>
  );
}
