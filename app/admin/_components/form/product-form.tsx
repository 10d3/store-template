"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
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
import { Plus, Edit, X, PlusCircle } from "lucide-react";
import { type StripeProduct } from "@/types/product";

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
  const [metadataEntries, setMetadataEntries] = useState<
    Array<{ key: string; value: string }>
  >([]);

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

  // Convert metadata object to array for editing
  const convertMetadataToEntries = (
    metadata: Record<string, string> | undefined
  ) => {
    if (!metadata) return [];
    return Object.entries(metadata).map(([key, value]) => ({ key, value }));
  };

  // Convert metadata entries array back to object
  const convertEntriesToMetadata = (
    entries: Array<{ key: string; value: string }>
  ) => {
    const metadata: Record<string, string> = {};
    entries.forEach(({ key, value }) => {
      if (key.trim() && value.trim()) {
        metadata[key.trim()] = value.trim();
      }
    });
    return metadata;
  };

  // Add new metadata entry
  const addMetadataEntry = () => {
    setMetadataEntries([...metadataEntries, { key: "", value: "" }]);
  };

  // Remove metadata entry
  const removeMetadataEntry = (index: number) => {
    const newEntries = metadataEntries.filter((_, i) => i !== index);
    setMetadataEntries(newEntries);
    // Update form with new metadata
    const metadata = convertEntriesToMetadata(newEntries);
    form.setValue("metadata", metadata);
  };

  // Update metadata entry
  const updateMetadataEntry = (
    index: number,
    field: "key" | "value",
    newValue: string
  ) => {
    const newEntries = [...metadataEntries];
    newEntries[index][field] = newValue;
    setMetadataEntries(newEntries);
    // Update form with new metadata
    const metadata = convertEntriesToMetadata(newEntries);
    form.setValue("metadata", metadata);
  };

  // Custom submit handler to ensure metadata is properly formatted
  const handleSubmit = (data: ProductFormData) => {
    const metadata = convertEntriesToMetadata(metadataEntries);
    onSubmit({ ...data, metadata });
  };

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
        metadata: initialData.metadata || {},
      };

      form.reset(formData);
      // Initialize metadata entries
      setMetadataEntries(convertMetadataToEntries(initialData.metadata));
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
      setMetadataEntries([]);
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
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
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

            {/* Metadata Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <FormLabel className="text-base font-medium">
                  Metadata
                </FormLabel>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addMetadataEntry}
                  className="flex items-center gap-2"
                >
                  <PlusCircle className="h-4 w-4" />
                  Add Metadata
                </Button>
              </div>

              {metadataEntries.length > 0 && (
                <div className="space-y-3 border rounded-md p-4">
                  {metadataEntries.map((entry, index) => (
                    <div key={index} className="flex gap-2 items-start">
                      <div className="flex-1">
                        <Input
                          placeholder="Key"
                          value={entry.key}
                          onChange={(e) =>
                            updateMetadataEntry(index, "key", e.target.value)
                          }
                        />
                      </div>
                      <div className="flex-1">
                        <Input
                          placeholder="Value"
                          value={entry.value}
                          onChange={(e) =>
                            updateMetadataEntry(index, "value", e.target.value)
                          }
                        />
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeMetadataEntry(index)}
                        className="px-2"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {metadataEntries.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No metadata entries. Click &quot;Add Metadata&quot; to add
                  custom key-value pairs.
                </p>
              )}
            </div>

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
