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

interface MultiPackFormProps {
    products: StripeProduct[];
    onSubmit: (data: PackFormData) => void;
    initialData?: StripeProduct;
    isLoading?: boolean;
    embed?: boolean;
}

// Default pack sizes configuration for sizes 2-6
const DEFAULT_PACK_SIZES: PackSizeConfig[] = [
    { size: 2, enabled: false, discountPercent: 5 },
    { size: 3, enabled: false, discountPercent: 10 },
    { size: 4, enabled: false, discountPercent: 15 },
    { size: 5, enabled: false, discountPercent: 20 },
    { size: 6, enabled: false, discountPercent: 25 },
];

export function MultiPackForm({
    products,
    onSubmit,
    initialData,
    isLoading,
    embed = false,
}: MultiPackFormProps) {
    const form = useForm<PackFormData>({
        resolver: zodResolver(packSchema),
        defaultValues: {
            name: "",
            description: "",
            productIds: [],
            packPrice: 0,
            discount: 0,
            images: [],
            packType: "same_product", // Hardcoded
            packSizes: DEFAULT_PACK_SIZES,
            metadata: {
                bundle_type: "fixed", // Hardcoded
            },
        },
    });

    // Reset form when initialData changes
    useEffect(() => {
        if (initialData) {
            const productIds = initialData.metadata?.contents
                ? initialData.metadata.contents.split(",").map(id => id.trim()).filter(Boolean)
                : [];

            // Parse pack sizes from metadata JSON
            let packSizes = DEFAULT_PACK_SIZES;
            if (initialData.metadata?.pack_sizes) {
                try {
                    const parsedSizes = JSON.parse(initialData.metadata.pack_sizes);
                    // Recalculate fixedPrice if missing but discount exists (Robust initialization)
                    /* eslint-disable @typescript-eslint/no-explicit-any */
                    packSizes = parsedSizes.map((sizeConfig: any) => {
                        if (sizeConfig.enabled && sizeConfig.discountPercent !== undefined && sizeConfig.fixedPrice === undefined) {
                            const basePrice = products?.find(p => productIds.includes(p.id))?.default_price;
                            let unitAmount = 0;
                            if (basePrice && typeof basePrice === 'object' && basePrice.unit_amount) {
                                unitAmount = basePrice.unit_amount;
                            }

                            if (unitAmount > 0) {
                                const totalBase = unitAmount * sizeConfig.size;
                                const calculatedFixed = Math.round(totalBase * (1 - sizeConfig.discountPercent / 100));
                                return { ...sizeConfig, fixedPrice: calculatedFixed };
                            }
                        }
                        return sizeConfig;
                    });
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
                packType: "same_product", // Enforce type
                packSizes,
            };

            // Ensure bundle_type is fixed
            if (resetValues.metadata) {
                resetValues.metadata.bundle_type = "fixed";
            }

            // Only include id if it exists
            if (initialData.id) {
                resetValues.id = initialData.id;
            }

            form.reset(resetValues);
        } else {
            // Reset to defaults for new form
            form.reset({
                name: "",
                description: "",
                productIds: [],
                packPrice: 0,
                discount: 0,
                images: [],
                packType: "same_product",
                packSizes: DEFAULT_PACK_SIZES,
                metadata: {
                    bundle_type: "fixed",
                },
            });
        }
    }, [initialData, form, products]);

    // Get selected products
    const watchedProductIds = form.watch("productIds");
    const selectedProducts = watchedProductIds?.length > 0
        ? watchedProductIds
        : (initialData?.metadata?.contents?.split(",").filter(Boolean) || []);

    const formatPrice = (amount: number, currency = "usd") => {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: currency.toUpperCase(),
        }).format(amount / 100);
    };

    const calculateTotalFromIds = (ids: string[]) => {
        return ids.reduce((sum, id) => {
            const product = products.find((p) => p.id === id);
            if (
                product &&
                product.default_price &&
                typeof product.default_price === "object" &&
                product.default_price.unit_amount !== null
            ) {
                return sum + product.default_price.unit_amount;
            }
            return sum;
        }, 0);
    };

    const calculateSuggestedPrice = () => {
        return calculateTotalFromIds(selectedProducts);
    };

    const suggestedPrice = calculateSuggestedPrice();
    // We'll use the suggested price as the base for calculations

    const isEditing = !!initialData;

    const onSubmitWrapped = (data: PackFormData) => {
        // Enforce our hardcoded values
        data.packType = "same_product";
        if (!data.metadata) data.metadata = {};
        data.metadata.bundle_type = "fixed";

        // Find the smallest enabled pack size to set as the "default price"
        // This avoids the confusing "single unit price" showing up as the bundle price
        if (data.packSizes && data.packSizes.length > 0) {
            const firstEnabled = data.packSizes
                .filter(s => s.enabled && s.fixedPrice)
                .sort((a, b) => a.size - b.size)[0];

            if (firstEnabled && firstEnabled.fixedPrice) {
                data.packPrice = firstEnabled.fixedPrice;
            }
        }

        console.log("data from pack", data)
        onSubmit(data);
    };

    const content = (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmitWrapped)} className="space-y-8">
                {/* Basic Information */}
                <div className="space-y-6">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Package className="h-5 w-5" />
                        Multi-Pack Information
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
                                            placeholder="e.g., Coffee Lovers Multi-Pack"
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
                                            placeholder="Describe this multi-pack..."
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
                                        Pack Main Image
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
                        Base Product Selection
                    </h3>

                    <FormField
                        control={form.control}
                        name="productIds"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-sm font-medium">
                                    Select ONE Base Product
                                </FormLabel>
                                <FormControl>
                                    <ProductMultiSelect
                                        products={products}
                                        selectedIds={field.value || []}
                                        onSelectionChange={(newIds) => {
                                            // Enforce single selection
                                            const lastSelected = newIds.length > 0 ? [newIds[newIds.length - 1]] : [];
                                            field.onChange(lastSelected);

                                            // Update pack price to match product price initially
                                            const total = calculateTotalFromIds(lastSelected);
                                            form.setValue("packPrice", total);
                                        }}
                                    />
                                </FormControl>
                                <FormDescription className="text-xs">
                                    Choose the product you want to create a multi-pack for.
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <Separator />

                {/* Categories */}
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
                                    placeholder="e.g. coffee-bundles"
                                    className="border-2 focus:border-blue-500 transition-colors"
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Pack Sizes Configuration */}
                <div className="mt-6 p-4 border-2 border-dashed border-green-200 rounded-lg bg-green-50/50">
                    <h4 className="font-semibold mb-4 text-green-800 flex items-center gap-2">
                        <Layers className="h-4 w-4" />
                        Pack Sizes Configuration
                    </h4>
                    <p className="text-xs text-green-700 mb-4">
                        Enable the pack sizes you want to offer (e.g., 2-pack, 3-pack). The price will be calculated based on the base product price: {formatPrice(suggestedPrice)}.
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
                                                            const newVal = Number(e.target.value);
                                                            const currentSizes = form.getValues("packSizes") || DEFAULT_PACK_SIZES;

                                                            // Calculate fixed price based on discount
                                                            let fixedPrice: number | undefined;
                                                            if (suggestedPrice > 0) {
                                                                const totalBase = suggestedPrice * size;
                                                                fixedPrice = Math.round(totalBase * (1 - newVal / 100));
                                                            }

                                                            const newSizes = currentSizes.map(s =>
                                                                s.size === size ? { ...s, discountPercent: newVal, fixedPrice } : s
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
                                                            const cents = e.target.value ? Number(e.target.value) * 100 : undefined;
                                                            const currentSizes = form.getValues("packSizes") || DEFAULT_PACK_SIZES;

                                                            // Calculate discount percent based on fixed price
                                                            let discountPercent = 0;
                                                            if (suggestedPrice > 0 && cents) {
                                                                const totalBase = suggestedPrice * size;
                                                                discountPercent = Math.max(0, Math.round(((totalBase - cents) / totalBase) * 100));
                                                            }

                                                            const newSizes = currentSizes.map(s =>
                                                                s.size === size ? { ...s, fixedPrice: cents, discountPercent } : s
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

                <Button
                    type="submit"
                    className="w-full h-12 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300"
                    disabled={isLoading || selectedProducts.length === 0}
                >
                    {isLoading ? (
                        <div className="flex items-center gap-2">
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            {isEditing ? "Updating Multi-Pack..." : "Creating Multi-Pack..."}
                        </div>
                    ) : isEditing ? (
                        "Update Multi-Pack"
                    ) : (
                        "Create Multi-Pack"
                    )}
                </Button>
            </form>
        </Form>
    );

    if (embed) {
        return content;
    }

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
                    {content}
                </CardContent>
            </Card>
        </div>
    );
}
