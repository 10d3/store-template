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
import { MetadataFormSection } from "@/components/shared/metadata-form-section";
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
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-6"
          >
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

            {/* Structured Metadata Section */}
            <MetadataFormSection 
              type="product"
              title="Product Metadata"
              description="Configure product-specific metadata for SEO, categorization, and business logic."
            />

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
