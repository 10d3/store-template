"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
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
import { Separator } from "@/components/ui/separator";
import { Package, ShoppingCart, Edit } from "lucide-react";
import { packSchema, type PackFormData } from "@/lib/product/product.schema";
import type { StripeProduct } from "@/types/product";
import { transformMetadataFromStripe } from "@/lib/metadata/form-utils";
import ProductMultiSelect from "@/components/shared/product-muli-select";

interface EnhancedPackFormProps {
  products: StripeProduct[];
  onSubmit: (data: PackFormData) => void;
  initialData?: StripeProduct;
  isLoading?: boolean;
}

export function EnhancedPackForm({
  products,
  onSubmit,
  initialData,
  isLoading,
}: EnhancedPackFormProps) {
  const form = useForm<PackFormData>({
    resolver: zodResolver(packSchema),
    defaultValues: {
      name: "",
      description: "",
      productIds: [],
      packPrice: 0,
      discount: 0,
    },
  });

  // Reset form when initialData changes
  useEffect(() => {
    if (initialData) {
      const productIds = initialData.metadata?.contents
        ? initialData.metadata.contents.split(",").filter(Boolean)
        : [];
      const resetValues: Partial<PackFormData> = {
        name: initialData.name,
        description: initialData.description || "",
        productIds,
        packPrice:
          initialData.default_price &&
            typeof initialData.default_price === "object" &&
            initialData.default_price.unit_amount !== null
            ? initialData.default_price.unit_amount
            : 0,
        discount: initialData.metadata?.discount
          ? Number.parseInt(initialData.metadata.discount)
          : 0,
        metadata: transformMetadataFromStripe(
          initialData.metadata || {},
          "product"
        ),
      };

      // Only include id if it exists
      if (initialData.id) {
        resetValues.id = initialData.id;
      }

      form.reset(resetValues);
    } else {
      form.reset({
        name: "",
        description: "",
        productIds: [],
        packPrice: 0,
        discount: 0,
        metadata: {},
      });
    }
  }, [initialData, form]);

  // Get selected products - use form watch with fallback to initialData
  const watchedProductIds = form.watch("productIds");
  const selectedProducts = watchedProductIds?.length > 0
    ? watchedProductIds
    : (initialData?.metadata?.contents?.split(",").filter(Boolean) || []);
  const packPrice = form.watch("packPrice");
  const discount = form.watch("discount");
  const isEditing = !!initialData;

  const formatPrice = (amount: number, currency = "usd") => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  };

  const calculateSuggestedPrice = () => {
    const selected = products.filter((p) => selectedProducts.includes(p.id));
    const total = selected.reduce((sum, product) => {
      if (
        product.default_price &&
        typeof product.default_price === "object" &&
        product.default_price.unit_amount !== null
      ) {
        return sum + product.default_price.unit_amount;
      }
      return sum;
    }, 0);
    return total;
  };

  const suggestedPrice = calculateSuggestedPrice();
  const savings = suggestedPrice - packPrice;
  const savingsPercentage =
    suggestedPrice > 0 ? ((savings / suggestedPrice) * 100).toFixed(1) : "0";

  return (
    <div className="max-w-4xl mx-auto">
      <Card className="border-0 shadow-lg">
        <CardHeader className="pb-6">
          <CardTitle className="flex items-center gap-3 text-2xl">
            {isEditing ? (
              <Edit className="h-6 w-6 text-blue-600" />
            ) : (
              <Package className="h-6 w-6 text-green-600" />
            )}
            {isEditing ? "Edit Product Pack" : "Create Product Pack"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              {/* Basic Information */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Pack Information
                </h3>

                <div className="grid gap-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">
                          Pack Name
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., 3-Coffee Starter Pack"
                            className="h-11 border-2 focus:border-blue-500 transition-colors"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">
                          Description (Optional)
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Describe your pack..."
                            className="min-h-[100px] border-2 focus:border-blue-500 transition-colors resize-none"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <Separator />

              {/* Product Selection */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  Product Selection
                </h3>

                <FormField
                  control={form.control}
                  name="productIds"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">
                        Select Products for Pack
                      </FormLabel>
                      <FormControl>
                        <ProductMultiSelect
                          products={products}
                          selectedIds={field.value || []}
                          onSelectionChange={field.onChange}
                        />
                      </FormControl>
                      <FormDescription className="text-xs">
                        Search and select products to include in this pack.
                        Existing packs are excluded.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Pricing Summary */}
                {selectedProducts.length > 0 && (
                  <Card className="border-2 border-primary">
                    <CardContent className="p-4">
                      <h4 className="font-semibold mb-3">
                        Pricing Summary
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="">
                            Individual total:
                          </span>
                          <span className="font-medium">
                            {formatPrice(suggestedPrice)}
                          </span>
                        </div>
                        {packPrice > 0 && (
                          <>
                            <div className="flex justify-between">
                              <span className="">Pack price:</span>
                              <span className="font-medium">
                                {formatPrice(packPrice)}
                              </span>
                            </div>
                            {savings > 0 && (
                              <div className="flex justify-between text-green-600">
                                <span>Customer saves:</span>
                                <span className="font-semibold">
                                  {formatPrice(savings)} ({savingsPercentage}%)
                                </span>
                              </div>
                            )}
                            {(discount || 0) > 0 && (
                              <div className="flex justify-between text-yellow-600">
                                <span>Discount:</span>
                                <span className="font-semibold">
                                  {formatPrice(discount || 0)}
                                </span>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              <Separator />

              {/* Pricing */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold">Pricing</h3>

                {/* Preset Discount Buttons */}
                {suggestedPrice > 0 && (
                  <div className="space-y-2">
                    <FormLabel className="text-sm font-medium">
                      Quick Discount Presets
                    </FormLabel>
                    <div className="flex flex-wrap gap-2">
                      {[10, 15, 20, 25, 30].map((percent) => {
                        const discountedPrice = Math.round(suggestedPrice * (1 - percent / 100));
                        return (
                          <Button
                            key={percent}
                            type="button"
                            variant={packPrice === discountedPrice ? "default" : "outline"}
                            size="sm"
                            onClick={() => {
                              form.setValue("packPrice", discountedPrice);
                              form.setValue("discount", percent);
                            }}
                            className="text-xs"
                          >
                            {percent}% off ({formatPrice(discountedPrice)})
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="packPrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">
                          Pack Price (cents)
                        </FormLabel>
                        <FormControl>
                          <div className="space-y-2">
                            <Input
                              type="number"
                              placeholder="2400"
                              className="h-11 border-2 focus:border-blue-500 transition-colors"
                              {...field}
                              onChange={(e) => {
                                const newPrice = Number.parseInt(e.target.value) || 0;
                                field.onChange(newPrice);
                                // Auto-calculate discount percentage
                                if (suggestedPrice > 0 && newPrice > 0) {
                                  const autoDiscount = Math.round(((suggestedPrice - newPrice) / suggestedPrice) * 100);
                                  form.setValue("discount", Math.max(0, autoDiscount));
                                }
                              }}
                            />
                            {suggestedPrice > 0 && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  field.onChange(suggestedPrice);
                                  form.setValue("discount", 0);
                                }}
                                className="w-full text-xs"
                              >
                                Use Individual Total (
                                {formatPrice(suggestedPrice)})
                              </Button>
                            )}
                          </div>
                        </FormControl>
                        <FormDescription className="text-xs">
                          Enter price in cents (e.g., 2400 = $24.00)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="discount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">
                          Discount Percentage
                          {savings > 0 && (
                            <span className="ml-2 text-green-600 font-normal">
                              (Save {formatPrice(savings)})
                            </span>
                          )}
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="10"
                            min="0"
                            max="100"
                            className="h-11 border-2 focus:border-blue-500 transition-colors"
                            {...field}
                            onChange={(e) => {
                              const newDiscount = Number.parseInt(e.target.value) || 0;
                              field.onChange(newDiscount);
                              // Auto-calculate pack price when discount changes
                              if (suggestedPrice > 0) {
                                const newPrice = Math.round(suggestedPrice * (1 - newDiscount / 100));
                                form.setValue("packPrice", newPrice);
                              }
                            }}
                          />
                        </FormControl>
                        <FormDescription className="text-xs">
                          {savingsPercentage}% savings from individual prices
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <Separator />

              {/* Pack Settings */}
              <Card className="border-2 border-gray-100">
                <CardHeader>
                  <CardTitle className="text-lg">Pack Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="metadata.bundle_type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">
                            Bundle Type
                          </FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger className="border-2 focus:border-blue-500 transition-colors">
                                <SelectValue placeholder="Select bundle type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="fixed">
                                Fixed Bundle
                              </SelectItem>
                              <SelectItem value="build_your_own">
                                Build Your Own
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription className="text-xs">
                            Fixed bundles have predetermined products, Build
                            Your Own allows customer selection
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="metadata.category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">
                            Category
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g. coffee-bundles, starter-packs"
                              className="border-2 focus:border-blue-500 transition-colors"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Build Your Own Pricing Configuration */}
                  {form.watch("metadata.bundle_type") === "build_your_own" && (
                    <div className="mt-6 p-4 border-2 border-dashed border-blue-200 rounded-lg bg-blue-50/50">
                      <h4 className="font-semibold mb-4 text-blue-800">Build Your Own Configuration</h4>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="metadata.pricing_type"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm font-medium">Pricing Type</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger className="border-2">
                                    <SelectValue placeholder="Select pricing type" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="percentage">Fixed Percentage Off</SelectItem>
                                  <SelectItem value="tiered">Tiered Discounts</SelectItem>
                                  <SelectItem value="fixed_price">Fixed Bundle Price</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="grid grid-cols-2 gap-2">
                          <FormField
                            control={form.control}
                            name="metadata.min_items"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-sm font-medium">Min Items</FormLabel>
                                <FormControl>
                                  <Input type="number" min="1" placeholder="3" {...field} />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="metadata.max_items"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-sm font-medium">Max Items</FormLabel>
                                <FormControl>
                                  <Input type="number" min="1" placeholder="5" {...field} />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>

                      {/* Conditional fields based on pricing type */}
                      {form.watch("metadata.pricing_type") === "percentage" && (
                        <FormField
                          control={form.control}
                          name="metadata.fixed_discount_percent"
                          render={({ field }) => (
                            <FormItem className="mt-4">
                              <FormLabel className="text-sm font-medium">Discount Percentage</FormLabel>
                              <FormControl>
                                <Input type="number" min="0" max="100" placeholder="15" {...field} />
                              </FormControl>
                              <FormDescription className="text-xs">Customers get this % off their selected items</FormDescription>
                            </FormItem>
                          )}
                        />
                      )}

                      {form.watch("metadata.pricing_type") === "fixed_price" && (
                        <FormField
                          control={form.control}
                          name="metadata.fixed_bundle_price"
                          render={({ field }) => (
                            <FormItem className="mt-4">
                              <FormLabel className="text-sm font-medium">Fixed Price (cents)</FormLabel>
                              <FormControl>
                                <Input type="number" min="0" placeholder="2500" {...field} />
                              </FormControl>
                              <FormDescription className="text-xs">Customer pays this fixed amount regardless of items</FormDescription>
                            </FormItem>
                          )}
                        />
                      )}

                      {form.watch("metadata.pricing_type") === "tiered" && (
                        <FormField
                          control={form.control}
                          name="metadata.tier_config"
                          render={({ field }) => (
                            <FormItem className="mt-4">
                              <FormLabel className="text-sm font-medium">Tier Configuration (JSON)</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder='[{"min":3,"percent":10},{"min":5,"percent":15}]'
                                  className="font-mono text-xs"
                                  {...field}
                                />
                              </FormControl>
                              <FormDescription className="text-xs">Discount increases with more items</FormDescription>
                            </FormItem>
                          )}
                        />
                      )}
                    </div>
                  )}

                  <div className="grid gap-6">
                    <FormField
                      control={form.control}
                      name="metadata.seo_title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">
                            SEO Title
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="SEO optimized title for this pack"
                              className="border-2 focus:border-blue-500 transition-colors"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="metadata.seo_description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">
                            SEO Description
                          </FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="SEO meta description for this pack"
                              className="border-2 focus:border-blue-500 transition-colors resize-none"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="metadata.tags"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">
                            Tags
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="bundle,starter,premium"
                              className="border-2 focus:border-blue-500 transition-colors"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription className="text-xs">
                            Comma-separated tags for search and filtering
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>

              <Button
                type="submit"
                className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300"
                disabled={isLoading || selectedProducts.length === 0}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {isEditing ? "Updating Pack..." : "Creating Pack..."}
                  </div>
                ) : isEditing ? (
                  "Update Pack"
                ) : (
                  "Create Pack"
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
