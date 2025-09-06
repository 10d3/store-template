"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ShippingFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  zipCode: string;
  description: string;
}

interface ShippingFormProps {
  onDataChange: (data: ShippingFormData) => void;
}

export function ShippingForm({ onDataChange }: ShippingFormProps) {
  const [formData, setFormData] = useState<ShippingFormData>({
    firstName: "Divyansh",
    lastName: "Agarwal",
    email: "divyansh@webyansh.com",
    phone: "+91 6377588843",
    city: "Bangalore",
    state: "Karnataka",
    zipCode: "560021",
    description: "",
  });

  const handleInputChange = (field: keyof ShippingFormData, value: string) => {
    const updatedData = { ...formData, [field]: value };
    setFormData(updatedData);
    onDataChange(updatedData);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-foreground">
            Shipping Address
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="space-y-2"
            >
              <Label
                htmlFor="firstName"
                className="text-sm font-medium text-foreground"
              >
                First Name*
              </Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => handleInputChange("firstName", e.target.value)}
                className="bg-input border-border focus:ring-primary focus:border-primary"
                placeholder="Enter your first name"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-2"
            >
              <Label
                htmlFor="lastName"
                className="text-sm font-medium text-foreground"
              >
                Last Name*
              </Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => handleInputChange("lastName", e.target.value)}
                className="bg-input border-border focus:ring-primary focus:border-primary"
                placeholder="Enter your last name"
              />
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-2"
          >
            <Label
              htmlFor="email"
              className="text-sm font-medium text-foreground"
            >
              Email*
            </Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              className="bg-input border-border focus:ring-primary focus:border-primary"
              placeholder="Enter your email address"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="space-y-2"
          >
            <Label
              htmlFor="phone"
              className="text-sm font-medium text-foreground"
            >
              Phone number*
            </Label>
            <div className="flex">
              <Select defaultValue="IND">
                <SelectTrigger className="w-20 bg-input border-border focus:ring-primary focus:border-primary rounded-r-none">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="IND">IND</SelectItem>
                  <SelectItem value="US">US</SelectItem>
                  <SelectItem value="UK">UK</SelectItem>
                </SelectContent>
              </Select>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                className="bg-input border-border focus:ring-primary focus:border-primary rounded-l-none border-l-0"
                placeholder="Enter your phone number"
              />
            </div>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="space-y-2"
            >
              <Label
                htmlFor="city"
                className="text-sm font-medium text-foreground"
              >
                City*
              </Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => handleInputChange("city", e.target.value)}
                className="bg-input border-border focus:ring-primary focus:border-primary"
                placeholder="Enter your city"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="space-y-2"
            >
              <Label
                htmlFor="state"
                className="text-sm font-medium text-foreground"
              >
                State*
              </Label>
              <Input
                id="state"
                value={formData.state}
                onChange={(e) => handleInputChange("state", e.target.value)}
                className="bg-input border-border focus:ring-primary focus:border-primary"
                placeholder="Enter your state"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="space-y-2"
            >
              <Label
                htmlFor="zipCode"
                className="text-sm font-medium text-foreground"
              >
                Zip Code*
              </Label>
              <Input
                id="zipCode"
                value={formData.zipCode}
                onChange={(e) => handleInputChange("zipCode", e.target.value)}
                className="bg-input border-border focus:ring-primary focus:border-primary"
                placeholder="Enter zip code"
              />
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="space-y-2"
          >
            <Label
              htmlFor="description"
              className="text-sm font-medium text-foreground"
            >
              Description*
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              className="bg-input border-border focus:ring-primary focus:border-primary min-h-[100px]"
              placeholder="Enter a description..."
            />
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
