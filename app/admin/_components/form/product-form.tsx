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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  type ProductFormData,
  productSchema,
} from "@/lib/product/product.schema";
import {
  Plus,
  Edit,
  Package,
  Trash2,
  Copy,
  ArrowUp,
  ArrowDown,
  Settings2,
} from "lucide-react";
import type { VariantData, ProductWithVariants } from "@/lib/catalog";
import { transformMetadataFromStripe } from "@/lib/metadata/form-utils";
import { archiveVariant, reorderVariants } from "@/lib/catalog";
import { toast } from "sonner";
import Image from "next/image";
import { UploadButton } from "@/lib/uploadthing";
import { uploadThemes } from "@/lib/theme/upload-theme";
import RelatedProductsSelector from "@/components/shared/related-products-selector";
import MarkdownField from "./markdown-field";
import ManageVariantsDialog from "../manage-variants-dialog";
import {
  BundleComponentPicker,
  type BundleComponentValue,
} from "../bundle-component-picker";

interface ProductFormProps {
  onSubmit: (data: ProductFormData) => void;
  initialData?: ProductWithVariants;
  isLoading?: boolean;
  products?: ProductWithVariants[]; // All products for related products selector
  embed?: boolean;
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
  compareAtPrice?: number;
  stock?: number;
  sku?: string;
  active?: boolean;
  position?: number;
};

const EMPTY_METADATA = {
  slug: "",
  category: "",
  gender: "",
  pack_size: "",
  seo_title: "",
  seo_description: "",
  tags: "",
  digital: "false",
  nutrition: "",
};

const isPersistedVariantId = (id?: string): id is string =>
  Boolean(id) && !id!.startsWith("variant-");

// Helper function to create form variant from a persisted ProductVariant row
function createFormVariantFromProductVariant(
  variant: VariantData,
  index: number
): FormVariant {
  const optionLabel = variant.options?.label || variant.options?.title || "";
  return {
    id: variant.id,
    name: optionLabel || variant.title || `Variant ${index + 1}`,
    price: variant.price ?? 0,
    currency: "usd",
    images: variant.image ? [variant.image] : [],
    metadata: variant.options || {},
    stock: variant.stock,
    sku: variant.sku ?? undefined,
    active: variant.active,
    position: index,
  };
}

// Kept out of the RHF metadata values: marketing_why_choose /
// marketing_how_to_use are not in PRODUCT_METADATA_FIELDS, so zod would reject
// them. They are serialized to JSON and merged into metadata after validation.

type MarketingImagePosition = "left" | "right";

interface MarketingBlockState {
  title: string;
  content: string;
  bullets: string[];
  imageSrc: string;
  imagePosition: MarketingImagePosition | "";
}

interface MarketingBlockFieldsProps {
  legend: string;
  value: MarketingBlockState;
  onChange: (next: MarketingBlockState) => void;
}

function createEmptyMarketingBlock(): MarketingBlockState {
  return { title: "", content: "", bullets: [], imageSrc: "", imagePosition: "" };
}

function parseMarketingBlock(raw: unknown): MarketingBlockState {
  const empty = createEmptyMarketingBlock();
  if (raw === null || raw === undefined) return empty;

  let parsed: unknown = raw;
  if (typeof raw === "string") {
    if (!raw.trim()) return empty;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return empty;
    }
  }

  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    return empty;
  }

  const obj = parsed as Record<string, unknown>;
  const imagePosition = obj.imagePosition;
  return {
    title: typeof obj.title === "string" ? obj.title : "",
    content: typeof obj.content === "string" ? obj.content : "",
    bullets: Array.isArray(obj.bullets)
      ? obj.bullets.filter((b): b is string => typeof b === "string")
      : [],
    imageSrc: typeof obj.imageSrc === "string" ? obj.imageSrc : "",
    imagePosition:
      imagePosition === "left" || imagePosition === "right"
        ? imagePosition
        : "",
  };
}

function serializeMarketingBlock(block: MarketingBlockState): string | null {
  const payload: {
    title?: string;
    content?: string;
    bullets?: string[];
    imageSrc?: string;
    imagePosition?: MarketingImagePosition;
  } = {};

  const title = block.title.trim();
  const content = block.content.trim();
  const imageSrc = block.imageSrc.trim();
  const bullets = block.bullets
    .map((bullet) => bullet.trim())
    .filter((bullet) => bullet.length > 0);

  if (title) payload.title = title;
  if (content) payload.content = content;
  if (bullets.length > 0) payload.bullets = bullets;
  if (imageSrc) payload.imageSrc = imageSrc;
  if (block.imagePosition === "left" || block.imagePosition === "right") {
    payload.imagePosition = block.imagePosition;
  }

  return Object.keys(payload).length > 0 ? JSON.stringify(payload) : null;
}

function MarketingBlockFields({
  legend,
  value,
  onChange,
}: MarketingBlockFieldsProps) {
  const update = (patch: Partial<MarketingBlockState>) =>
    onChange({ ...value, ...patch });

  const addBullet = () => update({ bullets: [...value.bullets, ""] });

  const updateBullet = (index: number, text: string) =>
    update({
      bullets: value.bullets.map((bullet, i) => (i === index ? text : bullet)),
    });

  const removeBullet = (index: number) =>
    update({ bullets: value.bullets.filter((_, i) => i !== index) });

  return (
    <div className="space-y-4 rounded-lg border-2 border-gray-200 p-4">
      <h4 className="text-base font-semibold">{legend}</h4>

      <div className="grid gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Title</label>
          <Input
            placeholder={`${legend} title`}
            className="border-2 focus:border-blue-500 transition-colors"
            value={value.title}
            onChange={(e) => update({ title: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Content</label>
          <Textarea
            placeholder={`${legend} description`}
            className="border-2 focus:border-blue-500 transition-colors resize-none"
            value={value.content}
            onChange={(e) => update({ content: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Bullets</label>
          <div className="space-y-2">
            {value.bullets.map((bullet, index) => (
              <div key={index} className="flex items-center gap-2">
                <Input
                  placeholder={`Bullet ${index + 1}`}
                  className="border-2 focus:border-blue-500 transition-colors"
                  value={bullet}
                  onChange={(e) => updateBullet(index, e.target.value)}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  title="Remove bullet"
                  onClick={() => removeBullet(index)}
                  className="h-8 w-8 flex-shrink-0 text-gray-500 hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              onClick={addBullet}
              className="flex items-center gap-2 border-2 border-dashed border-blue-300 text-blue-600 hover:bg-blue-50 hover:border-blue-400 transition-all duration-200 bg-transparent"
            >
              <Plus className="h-4 w-4" />
              Add bullet
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Image URL</label>
            <Input
              placeholder="/placeholder.jpg"
              className="border-2 focus:border-blue-500 transition-colors"
              value={value.imageSrc}
              onChange={(e) => update({ imageSrc: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">
              Optional image shown beside this block
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Image Position</label>
            <Select
              value={value.imagePosition || "default"}
              onValueChange={(next) =>
                update({
                  imagePosition:
                    next === "left" || next === "right" ? next : "",
                })
              }
            >
              <SelectTrigger className="border-2 focus:border-blue-500 transition-colors">
                <SelectValue placeholder="Default" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Default</SelectItem>
                <SelectItem value="left">Left</SelectItem>
                <SelectItem value="right">Right</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Optional placement of the image
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProductForm({
  onSubmit,
  initialData,
  isLoading,
  products = [],
  embed = false,
}: ProductFormProps) {
  const [isBundle, setIsBundle] = useState(initialData?.isBundle ?? false);
  const [manageOpen, setManageOpen] = useState(false);
  const [bundleComponents, setBundleComponents] = useState<
    BundleComponentValue[]
  >([]);
  const [whyChoose, setWhyChoose] = useState<MarketingBlockState>(
    createEmptyMarketingBlock
  );
  const [howToUse, setHowToUse] = useState<MarketingBlockState>(
    createEmptyMarketingBlock
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
      metadata: transformMetadataFromStripe(EMPTY_METADATA, "product"),
      variants: [],
      isBundle: false,
    },
  });

  // Reset form when initialData changes
  useEffect(() => {
    if (initialData) {
      const persistedVariants: FormVariant[] = initialData.variants
        ? initialData.variants.map(createFormVariantFromProductVariant)
        : [];

      const metadata = transformMetadataFromStripe(
        initialData.metadata || EMPTY_METADATA,
        "product"
      );
      setWhyChoose(parseMarketingBlock(metadata.marketing_why_choose));
      setHowToUse(parseMarketingBlock(metadata.marketing_how_to_use));
      delete metadata.marketing_why_choose;
      delete metadata.marketing_how_to_use;

      const formData: ProductFormData = {
        id: initialData.id,
        name: initialData.name,
        description: initialData.description || "",
        price: initialData.defaultVariant?.price ?? 1000,
        currency: "usd",
        images: initialData.images || [],
        metadata,
        variants: persistedVariants,
        isBundle: initialData.isBundle,
      };
      form.reset(formData);
      setIsBundle(initialData.isBundle);
    } else {
      form.reset({
        id: "",
        name: "",
        description: "",
        price: 1000,
        currency: "usd",
        images: [],
        metadata: transformMetadataFromStripe(EMPTY_METADATA, "product"),
        variants: [],
        isBundle: false,
      });
      setWhyChoose(createEmptyMarketingBlock());
      setHowToUse(createEmptyMarketingBlock());
      setIsBundle(false);
    }
  }, [initialData, form]);

  const isEditing = !!initialData;
  const variants = form.watch("variants") || [];

  // Keep the product-level price aligned with the first (default) variant so
  // the create/update flow's default-variant branch stays consistent.
  useEffect(() => {
    if (variants.length > 0) {
      const firstPrice = variants[0].price;
      if (form.getValues("price") !== firstPrice) {
        form.setValue("price", firstPrice);
      }
    }
  }, [variants, form]);

  const addVariant = () => {
    const newVariant: FormVariant = {
      id: `variant-${Date.now()}`, // Temporary ID for new variants
      name: "",
      description: "",
      images: [],
      price: 0,
      currency: "usd",
      metadata: {},
      stock: 0,
      active: true,
      position: variants.length,
    };
    const currentVariants = form.getValues("variants") || [];
    form.setValue("variants", [...currentVariants, newVariant]);
  };

  const duplicateVariant = (variantToDuplicate: FormVariant) => {
    const newVariant: FormVariant = {
      ...variantToDuplicate,
      id: `variant-${Date.now()}`,
      name: `${variantToDuplicate.name} (Copy)`,
    };
    const currentVariants = form.getValues("variants") || [];
    form.setValue("variants", [
      ...currentVariants,
      { ...newVariant, position: currentVariants.length },
    ]);
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

  const removeVariant = async (id: string) => {
    const currentVariants = form.getValues("variants") || [];
    const target = currentVariants.find((v) => v.id === id);
    const updatedVariants = currentVariants
      .filter((v) => v.id !== id)
      .map((v, index) => ({ ...v, position: index }));
    form.setValue("variants", updatedVariants);

    if (isEditing && target && isPersistedVariantId(target.id)) {
      const result = await archiveVariant(target.id);
      if (result.success) {
        toast.success("Variant archived");
      } else {
        toast.error(result.error || "Failed to archive variant");
      }
    }
  };

  const moveVariant = async (index: number, direction: -1 | 1) => {
    const currentVariants = form.getValues("variants") || [];
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= currentVariants.length) return;

    const next = [...currentVariants];
    const [moved] = next.splice(index, 1);
    next.splice(targetIndex, 0, moved);
    const reindexed = next.map((v, i) => ({ ...v, position: i }));
    form.setValue("variants", reindexed);

    if (isEditing) {
      const orderedIds = reindexed.map((v) => v.id);
      if (orderedIds.every(isPersistedVariantId)) {
        const result = await reorderVariants(orderedIds);
        if (!result.success) {
          toast.error(result.error || "Failed to reorder variants");
        }
      }
    }
  };

  const handleBundleToggle = (checked: boolean) => {
    setIsBundle(checked);
    form.setValue("isBundle", checked);
  };

  const handleSubmit = (data: ProductFormData) => {
    const metadata: Record<string, any> = { ...(data.metadata ?? {}) };
    const whyChooseJson = serializeMarketingBlock(whyChoose);
    const howToUseJson = serializeMarketingBlock(howToUse);

    if (whyChooseJson) {
      metadata.marketing_why_choose = whyChooseJson;
    } else {
      delete metadata.marketing_why_choose;
    }

    if (howToUseJson) {
      metadata.marketing_how_to_use = howToUseJson;
    } else {
      delete metadata.marketing_how_to_use;
    }

    onSubmit({ ...data, metadata });
  };

  const content = (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
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
                    <MarkdownField
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      placeholder="Describe the product — what it is, who it's for, key benefits. Markdown supported."
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

            <div className="flex flex-row items-center justify-between rounded-lg border-2 border-gray-200 p-4">
              <div className="space-y-0.5">
                <label className="text-base font-medium">Bundle / Pack</label>
                <p className="text-sm text-muted-foreground">
                  This product groups other products as a bundle
                </p>
              </div>
              <Switch checked={isBundle} onCheckedChange={handleBundleToggle} />
            </div>
          </div>
        </div>

        <Separator />

        {isBundle ? (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Package className="h-5 w-5" />
              Bundle Components
            </h3>
            <BundleComponentPicker
              products={products}
              bundleProductId={isEditing ? initialData?.id : undefined}
              value={isEditing ? undefined : bundleComponents}
              onChange={isEditing ? undefined : setBundleComponents}
              description={
                isEditing
                  ? "Add products and quantities that make up this bundle."
                  : "Add the products that make up this bundle. Components are saved once the product exists."
              }
            />
          </div>
        ) : (
          /* Product Variants Section */
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
              <div className="flex items-center gap-2">
                {isEditing && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setManageOpen(true)}
                    className="flex items-center gap-2"
                  >
                    <Settings2 className="h-4 w-4" />
                    Manage Variants
                  </Button>
                )}
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
            </div>

            {variants.length > 0 ? (
              <div className="rounded-md border-2 border-gray-200 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-20">Position</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead className="w-28">Price (¢)</TableHead>
                      <TableHead className="w-28">Compare at (¢)</TableHead>
                      <TableHead className="w-24">Stock</TableHead>
                      <TableHead className="w-32">SKU</TableHead>
                      <TableHead className="w-20">Active</TableHead>
                      <TableHead className="w-24 text-right">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {variants.map((variant, index) => (
                      <TableRow key={variant.id}>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-muted-foreground w-4">
                              {index + 1}
                            </span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              disabled={index === 0}
                              onClick={() => moveVariant(index, -1)}
                            >
                              <ArrowUp className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              disabled={index === variants.length - 1}
                              onClick={() => moveVariant(index, 1)}
                            >
                              <ArrowDown className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Input
                            placeholder="e.g. Small"
                            value={variant.name}
                            onChange={(e) =>
                              updateVariant(
                                variant.id!,
                                "name",
                                e.target.value
                              )
                            }
                            className="h-9 border-2 focus:border-blue-500 transition-colors"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            placeholder="1000"
                            value={variant.price || ""}
                            onChange={(e) =>
                              updateVariant(
                                variant.id!,
                                "price",
                                Number.parseInt(e.target.value) || 0
                              )
                            }
                            className="h-9 border-2 focus:border-blue-500 transition-colors"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            placeholder="0"
                            value={variant.compareAtPrice ?? ""}
                            onChange={(e) =>
                              updateVariant(
                                variant.id!,
                                "compareAtPrice",
                                e.target.value === ""
                                  ? 0
                                  : Number.parseInt(e.target.value) || 0
                              )
                            }
                            className="h-9 border-2 focus:border-blue-500 transition-colors"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            placeholder="0"
                            value={variant.stock ?? ""}
                            onChange={(e) =>
                              updateVariant(
                                variant.id!,
                                "stock",
                                e.target.value === ""
                                  ? 0
                                  : Number.parseInt(e.target.value) || 0
                              )
                            }
                            className="h-9 border-2 focus:border-blue-500 transition-colors"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            placeholder="SKU"
                            value={variant.sku ?? ""}
                            onChange={(e) =>
                              updateVariant(
                                variant.id!,
                                "sku",
                                e.target.value
                              )
                            }
                            className="h-9 border-2 focus:border-blue-500 transition-colors"
                          />
                        </TableCell>
                        <TableCell>
                          <Switch
                            checked={variant.active ?? true}
                            onCheckedChange={(checked) =>
                              updateVariant(variant.id!, "active", checked)
                            }
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              title="Duplicate"
                              onClick={() => duplicateVariant(variant)}
                              className="h-8 w-8 text-gray-500 hover:text-blue-600"
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              title="Remove variant"
                              onClick={() => removeVariant(variant.id!)}
                              className="h-8 w-8 text-gray-500 hover:text-red-600"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
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
        )}

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
                        value={field.value ?? ""}
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
                      <MarkdownField
                        value={field.value ?? ""}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        placeholder="Nutrition facts as a table — use Insert ▸ Nutrition table to start."
                        helperText="Renders as a styled table on the product page. Use Insert ▸ Nutrition table for the skeleton."
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
                        value={field.value ?? ""}
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
                        value={field.value ?? ""}
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

        <Separator />

        {/* Marketing Blocks */}
        <Card className="border-2 border-gray-100">
          <CardHeader>
            <CardTitle className="text-lg">Marketing Blocks</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <MarketingBlockFields
              legend="Why Choose"
              value={whyChoose}
              onChange={setWhyChoose}
            />
            <MarketingBlockFields
              legend="How to Use"
              value={howToUse}
              onChange={setHowToUse}
            />
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

        {isEditing && initialData && (
          <ManageVariantsDialog
            productId={initialData.id}
            productName={initialData.name}
                    trackInventory={initialData.defaultVariant?.trackInventory ?? false}
            open={manageOpen}
            onOpenChange={setManageOpen}
          />
        )}
      </form>
    </Form>
  );

  if (embed) {
    return content;
  }

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
          {content}
        </CardContent>
      </Card>
    </div>
  );
}
