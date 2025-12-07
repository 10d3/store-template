/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  type ProductFormData,
  productSchema,
} from "@/lib/product/product.schema";
import { Plus, Edit, ChevronDown, Package, Trash2, Copy } from "lucide-react";
import type { StripeProductVariant, StripeProduct } from "@/types/product";
import { transformMetadataFromStripe } from "@/lib/metadata/form-utils";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { UploadButton } from "@/lib/uploadthing";
import { uploadThemes } from "@/lib/theme/upload-theme";
import RelatedProductsSelector from "@/components/shared/related-products-selector";

interface ProductFormProps {
  onSubmit: (data: ProductFormData) => void;
  initialData?: StripeProduct;
  isLoading?: boolean;
  products?: StripeProduct[]; // All products for related products selector
}

// Define the form variant type
type FormVariant = {
  id?: string;
  name: string;
  price: number;
  currency: string;
  description?: string;
  images?: string[];
  metadata?: Record<string, any>;
};

// Helper function to transform StripeProductVariant to form variant
// function transformStripeVariantToFormVariant(
//   stripeVariant: StripeProductVariant
// ): FormVariant {
//   return {
//     id: stripeVariant.id,
//     name: stripeVariant.name,
//     price: stripeVariant.price,
//     currency: stripeVariant.currency,
//     description: stripeVariant.description || undefined,
//     images: stripeVariant.image || [],
//     metadata: stripeVariant.metadata || {},
//   };
// }

// Helper function to create form variant from StripeProductVariant
function createFormVariantFromStripe(
  stripeVariant: StripeProductVariant
): FormVariant {
  return {
    id: stripeVariant.id,
    name: stripeVariant.name,
    price: stripeVariant.price,
    currency: stripeVariant.currency,
    description: stripeVariant.description,
    images: stripeVariant.image || [],
    metadata: stripeVariant.metadata,
  };
}

export default function ProductForm({
  onSubmit,
  initialData,
  isLoading,
  products = [],
}: ProductFormProps) {
  const [showVariant, setShowVariant] = useState(false);
  const [expandedVariants, setExpandedVariants] = useState<Set<string>>(
    new Set()
  );

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      id: "",
      name: "",
      description: "",
      price: 1000,
      currency: "usd",
      images: [],
      metadata: transformMetadataFromStripe({
        slug: "",
        category: "",
        gender: "",
        pack_size: "",
        seo_title: "",
        seo_description: "",
        tags: "",
        digital: "false",
        nutrition: ""
      }, "product"),
      variants: [],
    },
  });

  // Reset form when initialData changes
  useEffect(() => {
    if (initialData) {
      const formData: ProductFormData = {
        id: initialData.id,
        name: initialData.name,
        description: initialData.description || "",
        price:
          initialData.default_price &&
            typeof initialData.default_price === "object" &&
            initialData.default_price.unit_amount !== null
            ? initialData.default_price.unit_amount
            : 1000,
        currency:
          initialData.default_price &&
            typeof initialData.default_price === "object" &&
            initialData.default_price.currency
            ? initialData.default_price.currency
            : "usd",
        images: initialData.images || [],
        metadata: transformMetadataFromStripe(initialData.metadata || {
          slug: "",
          category: "",
          gender: "",
          pack_size: "",
          seo_title: "",
          seo_description: "",
          tags: "",
          digital: "false",
          nutrition: ""
        }, "product"),
        variants: initialData.variants
          ? initialData.variants.map(createFormVariantFromStripe)
          : [],
      };
      form.reset(formData);
      if (formData.variants && formData.variants.length > 0) {
        setShowVariant(true);
      }
    } else {
      form.reset({
        id: "",
        name: "",
        description: "",
        price: 1000,
        currency: "usd",
        images: [],
        metadata: transformMetadataFromStripe({
          slug: "",
          category: "",
          gender: "",
          pack_size: "",
          seo_title: "",
          seo_description: "",
          tags: "",
          digital: "false",
          nutrition: ""
        }, "product"),
        variants: [],
      });
    }
  }, [initialData, form]);

  const isEditing = !!initialData;
  const variants = form.watch("variants") || [];

  const addVariant = () => {
    const newVariant: FormVariant = {
      id: `variant-${Date.now()}`, // Temporary ID for new variants
      name: "",
      description: "",
      images: [],
      price: 0,
      currency: "usd",
      metadata: {},
    };
    const currentVariants = form.getValues("variants") || [];
    form.setValue("variants", [...currentVariants, newVariant]);
    setShowVariant(true);
    // Auto-expand the new variant
    setExpandedVariants((prev) => new Set([...prev, newVariant.id!]));
  };

  const duplicateVariant = (variantToDuplicate: FormVariant) => {
    const newVariant: FormVariant = {
      ...variantToDuplicate,
      id: `variant-${Date.now()}`,
      name: `${variantToDuplicate.name} (Copy)`,
    };
    const currentVariants = form.getValues("variants") || [];
    form.setValue("variants", [...currentVariants, newVariant]);
    setExpandedVariants((prev) => new Set([...prev, newVariant.id!]));
  };

  const updateVariant = (
    id: string,
    field: string,
    value: string | number | boolean | string[]
  ) => {
    const currentVariants = form.getValues("variants") || [];
    const updatedVariants = currentVariants.map((v) => {
      if (v.id === id) {
        return {
          ...v,
          [field]: value,
        };
      }
      return v;
    });
    form.setValue("variants", updatedVariants);
  };

  const removeVariant = (id: string) => {
    const currentVariants = form.getValues("variants") || [];
    const updatedVariants = currentVariants.filter((v) => v.id !== id);
    form.setValue("variants", updatedVariants);
    setExpandedVariants((prev) => {
      const newSet = new Set(prev);
      newSet.delete(id);
      return newSet;
    });
    if (updatedVariants.length === 0) {
      setShowVariant(false);
    }
  };

  const toggleVariantExpansion = (id: string) => {
    setExpandedVariants((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card className="border-0 shadow-lg bg-card">
        <CardHeader className="pb-6">
          <CardTitle className="flex items-center gap-3 text-2xl">
            {isEditing ? (
              <Edit className="h-6 w-6 text-blue-600" />
            ) : (
              <Plus className="h-6 w-6 text-green-600" />
            )}
            {isEditing ? "Edit Product" : "Create Product"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              {/* Basic Information */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Basic Information
                </h3>

                <div className="grid gap-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">
                          Product Name
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter product name"
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
                          Description
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Enter product description"
                            className="min-h-[100px] border-2 focus:border-blue-500 transition-colors resize-none"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">
                            Price (cents)
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="1000"
                              className="h-11 border-2 focus:border-blue-500 transition-colors"
                              {...field}
                              onChange={(e) =>
                                field.onChange(
                                  Number.parseInt(e.target.value) || 0
                                )
                              }
                            />
                          </FormControl>
                          <FormDescription className="text-xs">
                            Enter price in cents (e.g., 1000 = $10.00)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="currency"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">
                            Currency
                          </FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger className="h-11 border-2 focus:border-blue-500 transition-colors">
                                <SelectValue placeholder="Select currency" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="usd">USD ($)</SelectItem>
                              <SelectItem value="eur">EUR (€)</SelectItem>
                              <SelectItem value="gbp">GBP (£)</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div>
                    <FormField
                      control={form.control}
                      name="images"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Image</FormLabel>
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
                                      <div
                                        key={index}
                                        className="relative group"
                                      >
                                        <Image
                                          width={1000}
                                          height={1000}
                                          src={item || "/placeholder.svg"}
                                          alt={`Uploaded image ${index + 1}`}
                                          className="w-16 h-16 object-cover rounded-md border"
                                        />
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const newImages = field.value
                                              ? [...field.value]
                                              : [];
                                            newImages.splice(index, 1);
                                            field.onChange(newImages);
                                          }}
                                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                          <svg
                                            className="w-4 h-4"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                          >
                                            <path
                                              strokeLinecap="round"
                                              strokeLinejoin="round"
                                              strokeWidth={2}
                                              d="M6 18L18 6M6 6l12 12"
                                            />
                                          </svg>
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                      <span className="text-sm font-medium text-green-800">
                                        {field.value.length}{" "}
                                        {field.value.length === 1
                                          ? "image"
                                          : "images"}{" "}
                                        uploaded successfully
                                      </span>
                                    </div>
                                  </div>
                                  <Button
                                    type="button"
                                    onClick={() => field.onChange([])}
                                    className="flex-shrink-0 p-1 text-green-600 hover:text-green-800 transition-colors"
                                  >
                                    <svg
                                      className="w-4 h-4"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M6 18L18 6M6 6l12 12"
                                      />
                                    </svg>
                                  </Button>
                                </div>
                              )}
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Product Variants Section */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Product Variants
                    {variants.length > 0 && (
                      <Badge variant="secondary" className="ml-2">
                        {variants.length}{" "}
                        {variants.length === 1 ? "variant" : "variants"}
                      </Badge>
                    )}
                  </h3>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addVariant}
                    className="flex items-center gap-2 border-2 border-dashed border-blue-300 text-blue-600 hover:bg-blue-50 hover:border-blue-400 transition-all duration-200 bg-transparent"
                  >
                    <Plus className="h-4 w-4" />
                    Add Variant
                  </Button>
                </div>

                <AnimatePresence>
                  {showVariant && variants.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      className="space-y-4"
                    >
                      {variants.map((variant, index) => (
                        <motion.div
                          key={variant.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{ duration: 0.2, delay: index * 0.1 }}
                        >
                          <Card className="border-2 border-gray-200 hover:border-gray-300 transition-colors">
                            <Collapsible
                              open={expandedVariants.has(variant.id!)}
                              onOpenChange={() =>
                                toggleVariantExpansion(variant.id!)
                              }
                            >
                              <CollapsibleTrigger asChild>
                                <CardHeader className="cursor-pointer transition-colors pb-4">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                      <ChevronDown
                                        className={`h-4 w-4 transition-transform duration-200 ${expandedVariants.has(variant.id!)
                                            ? "rotate-180"
                                            : ""
                                          }`}
                                      />
                                      <CardTitle className="text-base">
                                        {variant.name || `Variant ${index + 1}`}
                                      </CardTitle>
                                      {variant.price > 0 && (
                                        <Badge variant="outline">
                                          ${(variant.price / 100).toFixed(2)}
                                        </Badge>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          duplicateVariant(variant);
                                        }}
                                        className="h-8 w-8 text-gray-500 hover:text-blue-600"
                                      >
                                        <Copy className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          removeVariant(variant.id!);
                                        }}
                                        className="h-8 w-8 text-gray-500 hover:text-red-600"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </div>
                                </CardHeader>
                              </CollapsibleTrigger>

                              <CollapsibleContent>
                                <CardContent className="pt-0 space-y-4">
                                  <div className="grid gap-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      <div>
                                        <label className="text-sm font-medium mb-2 block">
                                          Variant Name
                                        </label>
                                        <Input
                                          placeholder="e.g., Small, Medium, Large"
                                          value={variant.name}
                                          onChange={(e) =>
                                            updateVariant(
                                              variant.id!,
                                              "name",
                                              e.target.value
                                            )
                                          }
                                          className="border-2 focus:border-blue-500 transition-colors"
                                        />
                                      </div>

                                      <div>
                                        <label className="text-sm font-medium mb-2 block">
                                          Price (cents)
                                        </label>
                                        <Input
                                          type="number"
                                          placeholder="1000"
                                          value={variant.price || ""}
                                          onChange={(e) =>
                                            updateVariant(
                                              variant.id!,
                                              "price",
                                              Number.parseInt(e.target.value) ||
                                              0
                                            )
                                          }
                                          className="border-2 focus:border-blue-500 transition-colors"
                                        />
                                      </div>
                                    </div>

                                    <div>
                                      <label className="text-sm font-medium mb-2 block">
                                        Description
                                      </label>
                                      <Textarea
                                        placeholder="Variant description (optional)"
                                        value={variant.description || ""}
                                        onChange={(e) =>
                                          updateVariant(
                                            variant.id!,
                                            "description",
                                            e.target.value
                                          )
                                        }
                                        className="border-2 focus:border-blue-500 transition-colors resize-none"
                                        rows={3}
                                      />
                                    </div>

                                    <div className="flex items-center justify-between p-4 rounded-lg">
                                      <div>
                                        <label className="text-sm font-medium">
                                          Active
                                        </label>
                                        <p className="text-xs">
                                          Whether this variant is available for
                                          purchase
                                        </p>
                                      </div>
                                      <Switch
                                        className=""
                                        checked={
                                          (variant as any).active || false
                                        }
                                        onCheckedChange={(checked) =>
                                          updateVariant(
                                            variant.id!,
                                            "active",
                                            checked
                                          )
                                        }
                                      />
                                    </div>
                                    <div className="space-y-3">
                                      <UploadButton
                                        appearance={
                                          uploadThemes.colorful.uploadButton
                                        }
                                        endpoint="imageUploader"
                                        onClientUploadComplete={(res) => {
                                          if (res?.[0]?.ufsUrl) {
                                            res.map((item) => {
                                              updateVariant(
                                                variant.id!,
                                                "images",
                                                [
                                                  ...(variant.images || []),
                                                  item.ufsUrl,
                                                ]
                                              );
                                            });
                                          }
                                        }}
                                        onUploadError={(error: Error) => {
                                          console.error("Upload error:", error);
                                        }}
                                      />
                                      {variant.images &&
                                        variant.images.length > 0 && (
                                          <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                                            <div className="flex-shrink-0 flex flex-row gap-2 flex-wrap">
                                              {variant.images.map(
                                                (item, index) => (
                                                  <div
                                                    key={index}
                                                    className="relative group"
                                                  >
                                                    <Image
                                                      width={1000}
                                                      height={1000}
                                                      src={
                                                        item ||
                                                        "/placeholder.svg"
                                                      }
                                                      alt={`Uploaded image ${index + 1}`}
                                                      className="w-16 h-16 object-cover rounded-md border"
                                                    />
                                                    <button
                                                      type="button"
                                                      onClick={() => {
                                                        const newImages =
                                                          variant.images
                                                            ? [
                                                              ...variant.images,
                                                            ]
                                                            : [];
                                                        newImages.splice(
                                                          index,
                                                          1
                                                        );
                                                        updateVariant(
                                                          variant.id!,
                                                          "images",
                                                          newImages
                                                        );
                                                      }}
                                                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    >
                                                      <svg
                                                        className="w-4 h-4"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        viewBox="0 0 24 24"
                                                      >
                                                        <path
                                                          strokeLinecap="round"
                                                          strokeLinejoin="round"
                                                          strokeWidth={2}
                                                          d="M6 18L18 6M6 6l12 12"
                                                        />
                                                      </svg>
                                                    </button>
                                                  </div>
                                                )
                                              )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                              <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                                <span className="text-sm font-medium text-green-800">
                                                  {variant.images.length}{" "}
                                                  {variant.images.length === 1
                                                    ? "image"
                                                    : "images"}{" "}
                                                  uploaded successfully
                                                </span>
                                              </div>
                                            </div>
                                            {/* <Button
                                              type="button"
                                              onClick={() => field.onChange([])}
                                              className="flex-shrink-0 p-1 text-green-600 hover:text-green-800 transition-colors"
                                            >
                                              <svg
                                                className="w-4 h-4"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                              >
                                                <path
                                                  strokeLinecap="round"
                                                  strokeLinejoin="round"
                                                  strokeWidth={2}
                                                  d="M6 18L18 6M6 6l12 12"
                                                />
                                              </svg>
                                            </Button> */}
                                          </div>
                                        )}
                                    </div>
                                  </div>
                                </CardContent>
                              </CollapsibleContent>
                            </Collapsible>
                          </Card>
                        </motion.div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>

                {!showVariant && (
                  <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
                    <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 mb-4">No variants added yet</p>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={addVariant}
                      className="border-2 border-dashed border-blue-300 text-blue-600 hover:bg-blue-50 bg-transparent"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Your First Variant
                    </Button>
                  </div>
                )}
              </div>

              <Separator />

              {/* Metadata Section */}
              <Card className="border-2 border-gray-100">
                <CardHeader>
                  <CardTitle className="text-lg">
                    Additional Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="metadata.slug"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">
                            Product Slug
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g. premium-coffee-blend"
                              className="border-2 focus:border-blue-500 transition-colors"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription className="text-xs">
                            Used for grouping similar products together
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
                              placeholder="e.g. coffee, apparel"
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
                      name="metadata.gender"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">
                            Target Audience
                          </FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger className="border-2 focus:border-blue-500 transition-colors">
                                <SelectValue placeholder="Choose audience" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="unisex">Unisex</SelectItem>
                              <SelectItem value="men">Men</SelectItem>
                              <SelectItem value="women">Women</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="metadata.pack_size"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">
                            Pack Size (units)
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="1"
                              className="border-2 focus:border-blue-500 transition-colors"
                              {...field}
                              onChange={(e) => field.onChange(e.target.value)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

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
                              placeholder="SEO optimized title"
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
                      name="metadata.nutrition"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">
                            Nutrition Details
                          </FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Enter product description"
                              className="min-h-[100px] border-2 focus:border-blue-500 transition-colors resize-none"
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
                              placeholder="SEO meta description"
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
                              placeholder="organic,fair-trade,premium"
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

                    {/* Related Products Selector */}
                    {products.length > 0 && (
                      <FormField
                        control={form.control}
                        name="metadata.related_products"
                        render={({ field }) => (
                          <RelatedProductsSelector
                            products={products}
                            value={field.value || ""}
                            onChange={field.onChange}
                            currentProductId={initialData?.id}
                          />
                        )}
                      />
                    )}

                    <FormField
                      control={form.control}
                      name="metadata.digital"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border-2 border-gray-200 p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base font-medium">
                              Digital Product
                            </FormLabel>
                            <FormDescription className="text-sm">
                              This product doesn&apos;t require shipping
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value === "true"}
                              onCheckedChange={(checked) =>
                                field.onChange(checked ? "true" : "false")
                              }
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>

              <Button
                type="submit"
                className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Processing...
                  </div>
                ) : isEditing ? (
                  "Update Product"
                ) : (
                  "Create Product"
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
