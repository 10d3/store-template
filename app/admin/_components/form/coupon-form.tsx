"use client";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Percent, Gift, Zap, Edit } from "lucide-react";
import { couponSchema, CouponFormData } from "@/lib/product/product.schema";
import { StripeCoupon } from "@/types/product";
import { MetadataFormSection } from "@/components/shared/metadata-form-section";
import { transformMetadataFromStripe } from "@/lib/metadata/form-utils";

interface EnhancedCouponFormProps {
  onSubmit: (data: CouponFormData) => void;
  onPresetSubmit: (preset: "4for3" | "15off3") => void;
  initialData?: StripeCoupon;
  isLoading?: boolean;
}

export function EnhancedCouponForm({
  onSubmit,
  onPresetSubmit,
  initialData,
  isLoading,
}: EnhancedCouponFormProps) {
  const [couponType, setCouponType] = useState<"preset" | "custom">("preset");
  const isEditing = !!initialData;

  const form = useForm<CouponFormData>({
    resolver: zodResolver(couponSchema),
    defaultValues: {
      duration: "once",
      currency: "usd",
    },
  });

  // Reset form when initialData changes
  useEffect(() => {
    if (initialData) {
      const resetValues: Partial<CouponFormData> = {
        name: initialData.name || "",
        percent_off: initialData.percent_off || undefined,
        amount_off: initialData.amount_off || undefined,
        currency: initialData.currency || "usd",
        duration:
          (initialData.duration as "once" | "repeating" | "forever") || "once",
        metadata: transformMetadataFromStripe(initialData.metadata || {}, "coupon"),
      };

      // Only include id if it exists
      if (initialData.id) {
        resetValues.id = initialData.id;
      }

      form.reset(resetValues);
      setCouponType("custom"); // Switch to custom when editing
    } else {
      form.reset({
        duration: "once",
        currency: "usd",
        metadata: {},
      });
      setCouponType("preset");
    }
  }, [initialData, form]);

  const handlePresetCoupon = (preset: "4for3" | "15off3") => {
    onPresetSubmit(preset);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {isEditing ? (
            <>
              <Edit className="h-5 w-5" />
              Edit Coupon
            </>
          ) : (
            <>
              <Percent className="h-5 w-5" />
              Create Coupon
            </>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Coupon Type Selection - Hide when editing */}
        {!isEditing && (
          <>
            <div className="space-y-3">
              <Label className="text-sm font-medium">Coupon Type</Label>
              <RadioGroup
                value={couponType}
                onValueChange={(value) =>
                  setCouponType(value as "preset" | "custom")
                }
                className="flex flex-col space-y-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="preset" id="preset" />
                  <Label htmlFor="preset">Quick Presets</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="custom" id="custom" />
                  <Label htmlFor="custom">Custom Coupon</Label>
                </div>
              </RadioGroup>
            </div>

            <Separator />
          </>
        )}

        {couponType === "preset" && !isEditing ? (
          /* Preset Coupons */
          <div className="space-y-3">
            <h3 className="font-medium">Quick Coupon Presets</h3>
            <div className="grid gap-3">
              <Button
                onClick={() => handlePresetCoupon("4for3")}
                disabled={isLoading}
                variant="outline"
                className="h-auto p-4 flex flex-col items-start space-y-2"
              >
                <div className="flex items-center gap-2">
                  <Gift className="h-4 w-4" />
                  <span className="font-medium">4-for-3 Deal</span>
                </div>
                <p className="text-sm text-muted-foreground text-left">
                  Buy 3 items, get the cheapest one free
                </p>
              </Button>

              <Button
                onClick={() => handlePresetCoupon("15off3")}
                disabled={isLoading}
                variant="outline"
                className="h-auto p-4 flex flex-col items-start space-y-2"
              >
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  <span className="font-medium">15% off 3+ items</span>
                </div>
                <p className="text-sm text-muted-foreground text-left">
                  15% discount when buying 3 or more items
                </p>
              </Button>
            </div>
          </div>
        ) : (
          /* Custom Coupon Form */
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Coupon Name (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter coupon name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="percent_off"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Percentage Off (1-100)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="10"
                        min="1"
                        max="100"
                        {...field}
                        onChange={(e) =>
                          field.onChange(
                            Number.parseInt(e.target.value) || undefined
                          )
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="duration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duration</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select duration" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="once">Once</SelectItem>
                        <SelectItem value="repeating">Repeating</SelectItem>
                        <SelectItem value="forever">Forever</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Structured Metadata Section */}
              <MetadataFormSection 
                type="coupon"
                title="Coupon Metadata"
                description="Configure coupon-specific metadata for tracking, analytics, and business logic."
              />

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading
                  ? isEditing
                    ? "Updating..."
                    : "Creating..."
                  : isEditing
                  ? "Update Coupon"
                  : "Create Custom Coupon"}
              </Button>
            </form>
          </Form>
        )}
      </CardContent>
    </Card>
  );
}
