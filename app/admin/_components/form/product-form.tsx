"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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
import {
  type ProductFormData,
  productSchema,
} from "@/lib/product/product.schema";
import { Plus, Edit } from "lucide-react";
import { type StripeProduct } from "@/types/product";
import { transformMetadataFromStripe } from "@/lib/metadata/form-utils";

interface ProductFormProps {
  onSubmit: (data: ProductFormData) => void;
  initialData?: StripeProduct;
  isLoading?: boolean;
}

export function ProductForm({
  onSubmit,
  initialData,
  isLoading,
}: ProductFormProps) {
  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      id: "",
      name: "",
      description: "",
      price: 1000,
      currency: "usd",
      images: [],
      metadata: {},
    },
  });

  // Reset form when initialData changes
  useEffect(() => {
    if (initialData) {
      const formData = {
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
        metadata: initialData.metadata
          ? transformMetadataFromStripe(initialData.metadata, "product")
          : {},
      };

      form.reset(formData);
    } else {
      form.reset({
        id: "",
        name: "",
        description: "",
        price: 1000,
        currency: "usd",
        images: [],
        metadata: {},
      });
    }
  }, [initialData, form]);

  const isEditing = !!initialData;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {isEditing ? (
            <Edit className="h-5 w-5" />
          ) : (
            <Plus className="h-5 w-5" />
          )}
          {isEditing ? "Edit Product" : "Create Product"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter product name" {...field} />
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
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter product description"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price (cents)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="1000"
                        {...field}
                        onChange={(e) =>
                          field.onChange(Number.parseInt(e.target.value) || 0)
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Currency</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select currency" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="usd">USD</SelectItem>
                        <SelectItem value="eur">EUR</SelectItem>
                        <SelectItem value="gbp">GBP</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Only the friendly ones */}
            <Card className="p-4 space-y-4">
              <h3 className="font-semibold">Extra Info</h3>

              <FormField
                control={form.control}
                name="metadata.slug"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product Slug</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. premium-coffee-blend"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
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
                    <FormLabel>Category</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. coffee, apparel" {...field} />
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
                    <FormLabel>Gender / Target</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
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
                name="metadata.seo_title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>SEO Title</FormLabel>
                    <FormControl>
                      <Input placeholder="SEO optimized title" {...field} />
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
                    <FormLabel>SEO Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="SEO meta description" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="metadata.pack_size"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pack Size (units)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="1"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value)}
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
                    <FormLabel>Tags</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="organic,fair-trade,premium"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Comma-separated tags for search and filtering
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="metadata.digital"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        Digital Product
                      </FormLabel>
                      <FormDescription>
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
            </Card>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading
                ? "Processing..."
                : isEditing
                  ? "Update Product"
                  : "Create Product"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
