"use client";

import { useFormContext } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { getMetadataFields, type MetadataField } from "@/lib/metadata/config";
import { Settings, Info } from "lucide-react";

interface MetadataFormSectionProps {
  type: 'product' | 'price' | 'coupon' | 'checkout' | 'shipping';
  title?: string;
  description?: string;
  className?: string;
}

export function MetadataFormSection({
  type,
  title,
  description,
  className = "",
}: MetadataFormSectionProps) {
  const form = useFormContext();
  const fields = getMetadataFields(type);

  if (fields.length === 0) {
    return null;
  }

  const defaultTitle = {
    product: "Product Metadata",
    price: "Price Metadata", 
    coupon: "Coupon Metadata",
    checkout: "Order Metadata",
    shipping: "Shipping & Customs"
  }[type];

  const renderField = (field: MetadataField) => {
    const fieldName = `metadata.${field.key}`;

    switch (field.type) {
      case 'text':
        return (
          <FormField
            key={field.key}
            control={form.control}
            name={fieldName}
            render={({ field: formField }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  {field.label}
                  {field.required && <Badge variant="destructive" className="text-xs">Required</Badge>}
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder={field.placeholder}
                    {...formField}
                    value={formField.value || ""}
                  />
                </FormControl>
                {field.description && (
                  <FormDescription className="flex items-start gap-1">
                    <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
                    <span className="text-xs">{field.description}</span>
                  </FormDescription>
                )}
                <FormMessage />
              </FormItem>
            )}
          />
        );

      case 'textarea':
        return (
          <FormField
            key={field.key}
            control={form.control}
            name={fieldName}
            render={({ field: formField }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  {field.label}
                  {field.required && <Badge variant="destructive" className="text-xs">Required</Badge>}
                </FormLabel>
                <FormControl>
                  <Textarea
                    placeholder={field.placeholder}
                    className="resize-none"
                    {...formField}
                    value={formField.value || ""}
                  />
                </FormControl>
                {field.description && (
                  <FormDescription className="flex items-start gap-1">
                    <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
                    <span className="text-xs">{field.description}</span>
                  </FormDescription>
                )}
                <FormMessage />
              </FormItem>
            )}
          />
        );

      case 'number':
        return (
          <FormField
            key={field.key}
            control={form.control}
            name={fieldName}
            render={({ field: formField }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  {field.label}
                  {field.required && <Badge variant="destructive" className="text-xs">Required</Badge>}
                </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder={field.placeholder}
                    min={field.min}
                    max={field.max}
                    {...formField}
                    value={formField.value || ""}
                    onChange={(e) => {
                      const value = e.target.value;
                      formField.onChange(value === "" ? "" : value);
                    }}
                  />
                </FormControl>
                {field.description && (
                  <FormDescription className="flex items-start gap-1">
                    <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
                    <span className="text-xs">{field.description}</span>
                  </FormDescription>
                )}
                <FormMessage />
              </FormItem>
            )}
          />
        );

      case 'select':
        return (
          <FormField
            key={field.key}
            control={form.control}
            name={fieldName}
            render={({ field: formField }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  {field.label}
                  {field.required && <Badge variant="destructive" className="text-xs">Required</Badge>}
                </FormLabel>
                <Select
                  onValueChange={formField.onChange}
                  value={formField.value || ""}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={field.placeholder} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {field.options?.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {field.description && (
                  <FormDescription className="flex items-start gap-1">
                    <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
                    <span className="text-xs">{field.description}</span>
                  </FormDescription>
                )}
                <FormMessage />
              </FormItem>
            )}
          />
        );

      case 'boolean':
        return (
          <FormField
            key={field.key}
            control={form.control}
            name={fieldName}
            render={({ field: formField }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={formField.value === "true" || formField.value === true}
                    onCheckedChange={(checked) => {
                      formField.onChange(checked ? "true" : "false");
                    }}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel className="flex items-center gap-2">
                    {field.label}
                    {field.required && <Badge variant="destructive" className="text-xs">Required</Badge>}
                  </FormLabel>
                  {field.description && (
                    <FormDescription className="flex items-start gap-1">
                      <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
                      <span className="text-xs">{field.description}</span>
                    </FormDescription>
                  )}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        );

      case 'multi-select':
        // For now, implement as comma-separated text input
        // Can be enhanced later with a proper multi-select component
        return (
          <FormField
            key={field.key}
            control={form.control}
            name={fieldName}
            render={({ field: formField }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  {field.label}
                  {field.required && <Badge variant="destructive" className="text-xs">Required</Badge>}
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder={field.placeholder || "Enter comma-separated values"}
                    {...formField}
                    value={formField.value || ""}
                  />
                </FormControl>
                {field.description && (
                  <FormDescription className="flex items-start gap-1">
                    <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
                    <span className="text-xs">{field.description}</span>
                  </FormDescription>
                )}
                <FormMessage />
              </FormItem>
            )}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center gap-2 pb-2 border-b">
        <Settings className="h-4 w-4" />
        <h3 className="text-base font-medium">{title || defaultTitle}</h3>
      </div>
      
      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {fields.map(renderField)}
      </div>
    </div>
  );
}