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
import { Package, ShoppingCart, Edit, Layers, ImageIcon } from "lucide-react";
import { packSchema, type PackFormData, type PackSizeConfig } from "@/lib/product/product.schema";
import type { StripeProduct } from "@/types/product";
import { transformMetadataFromStripe } from "@/lib/metadata/form-utils";
import ProductMultiSelect from "@/components/shared/product-muli-select";
import { Switch } from "@/components/ui/switch";
import Image from "next/image";
import { UploadButton } from "@/lib/uploadthing";
import { uploadThemes } from "@/lib/theme/upload-theme";

interface EnhancedPackFormProps {
  products: StripeProduct[];
  onSubmit: (data: PackFormData) => void;
  initialData?: StripeProduct;
  isLoading?: boolean;
}

// Default pack sizes configuration for sizes 2-6 (defined outside component to prevent recreation)
const DEFAULT_PACK_SIZES: PackSizeConfig[] = [
  { size: 2, enabled: false, discountPercent: 5 },
  { size: 3, enabled: false, discountPercent: 10 },
  { size: 4, enabled: false, discountPercent: 15 },
  { size: 5, enabled: false, discountPercent: 20 },
  { size: 6, enabled: false, discountPercent: 25 },
];

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
      images: [],
      packType: undefined,
      packSizes: DEFAULT_PACK_SIZES,
    },
  });

  // Reset form when initialData changes
  useEffect(() => {
    if (initialData) {
      const productIds = initialData.metadata?.contents
        ? initialData.metadata.contents.split(",").filter(Boolean)
        : [];

      // Parse pack sizes from metadata JSON
      let packSizes = DEFAULT_PACK_SIZES;
      if (initialData.metadata?.pack_sizes) {
        try {
          packSizes = JSON.parse(initialData.metadata.pack_sizes);
        } catch {
          console.warn("Failed to parse pack_sizes metadata");
        }
      }

      const resetValues: Partial<PackFormData> = {
        name: initialData.name,
        description: initialData.description || "",
        images: initialData.images || [],
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
        packType: initialData.metadata?.pack_type as PackFormData["packType"],
        packSizes,
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
        images: [],
        metadata: {},
        packType: undefined,
        packSizes: DEFAULT_PACK_SIZES,
      });
    }
  }, [initialData, form, DEFAULT_PACK_SIZES]);

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

                  {/* Pack Image Upload */}
                  <FormField
                    control={form.control}
                    name="images"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium flex items-center gap-2">
                          <ImageIcon className="h-4 w-4" />
                          Pack Image
                        </FormLabel>
                        <FormControl>
                          <div className="space-y-3">
                            <UploadButton
                              appearance={uploadThemes.colorful.uploadButton}
                              endpoint="imageUploader"
                              onClientUploadComplete={(res) => {
                                if (res?.[0]?.ufsUrl) {
                                  res.map((item) => {
                                    field.onChange([
                                      ...(field.value || []),
                                      item.ufsUrl,
                                    ]);
                                  });
                                }
                              }}
                              onUploadError={(error: Error) => {
                                console.error("Upload error:", error);
                              }}
                            />
                            {field.value && field.value.length > 0 && (
                              <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                                <div className="flex-shrink-0 flex flex-row gap-2 flex-wrap">
                                  {field.value.map((item, index) => (
                                    <div key={index} className="relative group">
                                      <Image
                                        width={80}
                                        height={80}
                                        src={item || "/placeholder.svg"}
                                        alt={`Pack image ${index + 1}`}
                                        className="w-16 h-16 object-cover rounded-md border"
                                      />
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const newImages = field.value ? [...field.value] : [];
                                          newImages.splice(index, 1);
                                          field.onChange(newImages);
                                        }}
                                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                      >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                      </button>
                                    </div>
                                  ))}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                    <span className="text-sm font-medium text-green-800">
                                      {field.value.length} {field.value.length === 1 ? "image" : "images"} uploaded
                                    </span>
                                  </div>
                                </div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => field.onChange([])}
                                  className="text-red-600 hover:text-red-800"
                                >
                                  Clear all
                                </Button>
                              </div>
                            )}
                          </div>
                        </FormControl>
                        <FormDescription className="text-xs">
                          Upload an image for this pack. This will be displayed on the storefront.
                        </FormDescription>
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

                  {/* Pack Type Selection */}
                  <div className="mt-6">
                    <FormField
                      control={form.control}
                      name="packType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">
                            Pack Type
                          </FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger className="border-2 focus:border-blue-500 transition-colors">
                                <SelectValue placeholder="Select pack type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="same_product">
                                Same Product (buy X of same item)
                              </SelectItem>
                              <SelectItem value="mixed_products">
                                Mixed Products (any items from selection)
                              </SelectItem>
                              <SelectItem value="curated">
                                Curated Bundle (fixed products)
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription className="text-xs">
                            Same Product = quantity discount on one item. Mixed = pick any items from the pool.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Pack Sizes Configuration */}
                  {(form.watch("packType") === "same_product" || form.watch("packType") === "mixed_products" || (form.watch("packSizes") || []).some(s => s.enabled)) && (
                    <div className="mt-6 p-4 border-2 border-dashed border-green-200 rounded-lg bg-green-50/50">
                      <h4 className="font-semibold mb-4 text-green-800 flex items-center gap-2">
                        <Layers className="h-4 w-4" />
                        Pack Sizes Configuration
                      </h4>
                      <p className="text-xs text-green-700 mb-4">
                        Configure which pack sizes are available and their discounts. Enable sizes you want to offer.
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                        {[2, 3, 4, 5, 6].map((size, index) => {
                          const packSizes = form.watch("packSizes") || DEFAULT_PACK_SIZES;
                          const sizeConfig = packSizes.find(s => s.size === size) || { size, enabled: false, discountPercent: 5 * index };

                          return (
                            <Card key={size} className={`border-2 transition-all ${sizeConfig.enabled ? 'border-green-400 bg-green-50' : 'border-gray-200 bg-gray-50/50'}`}>
                              <CardContent className="p-4">
                                <div className="flex items-center justify-between mb-3">
                                  <span className="font-bold text-lg">Pack of {size}</span>
                                  <Switch
                                    checked={sizeConfig.enabled}
                                    onCheckedChange={(checked) => {
                                      const currentSizes = form.getValues("packSizes") || DEFAULT_PACK_SIZES;
                                      const newSizes = currentSizes.map(s =>
                                        s.size === size ? { ...s, enabled: checked } : s
                                      );
                                      form.setValue("packSizes", newSizes);
                                    }}
                                  />
                                </div>

                                {sizeConfig.enabled && (
                                  <div className="space-y-3">
                                    <div>
                                      <label className="text-xs font-medium text-gray-600">Discount %</label>
                                      <Input
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={sizeConfig.discountPercent || 0}
                                        onChange={(e) => {
                                          const currentSizes = form.getValues("packSizes") || DEFAULT_PACK_SIZES;
                                          const newSizes = currentSizes.map(s =>
                                            s.size === size ? { ...s, discountPercent: Number(e.target.value) } : s
                                          );
                                          form.setValue("packSizes", newSizes);
                                        }}
                                        className="h-8 text-sm"
                                      />
                                    </div>

                                    <div>
                                      <label className="text-xs font-medium text-gray-600">Or Fixed Price ($)</label>
                                      <Input
                                        type="number"
                                        min="0"
                                        placeholder="Optional"
                                        value={sizeConfig.fixedPrice ? sizeConfig.fixedPrice / 100 : ""}
                                        onChange={(e) => {
                                          const currentSizes = form.getValues("packSizes") || DEFAULT_PACK_SIZES;
                                          const cents = e.target.value ? Number(e.target.value) * 100 : undefined;
                                          const newSizes = currentSizes.map(s =>
                                            s.size === size ? { ...s, fixedPrice: cents } : s
                                          );
                                          form.setValue("packSizes", newSizes);
                                        }}
                                        className="h-8 text-sm"
                                      />
                                    </div>

                                    {/* Image for this pack size */}
                                    <div>
                                      <label className="text-xs font-medium text-gray-600 block mb-1">Pack Image</label>
                                      {sizeConfig.image ? (
                                        <div className="relative group">
                                          <Image
                                            width={80}
                                            height={80}
                                            src={sizeConfig.image}
                                            alt={`Pack of ${size}`}
                                            className="w-full h-16 object-cover rounded border"
                                          />
                                          <button
                                            type="button"
                                            onClick={() => {
                                              const currentSizes = form.getValues("packSizes") || DEFAULT_PACK_SIZES;
                                              const newSizes = currentSizes.map(s =>
                                                s.size === size ? { ...s, image: undefined } : s
                                              );
                                              form.setValue("packSizes", newSizes);
                                            }}
                                            className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                          >
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                          </button>
                                        </div>
                                      ) : (
                                        <UploadButton
                                          appearance={{
                                            button: "text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded w-full",
                                          }}
                                          endpoint="imageUploader"
                                          onClientUploadComplete={(res) => {
                                            if (res?.[0]?.ufsUrl) {
                                              const currentSizes = form.getValues("packSizes") || DEFAULT_PACK_SIZES;
                                              const newSizes = currentSizes.map(s =>
                                                s.size === size ? { ...s, image: res[0].ufsUrl } : s
                                              );
                                              form.setValue("packSizes", newSizes);
                                            }
                                          }}
                                          onUploadError={(error: Error) => {
                                            console.error("Upload error:", error);
                                          }}
                                        />
                                      )}
                                    </div>
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    </div>
                  )}

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
