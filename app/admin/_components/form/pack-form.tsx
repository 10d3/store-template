"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
// import {
//   type PackFormData,
//   packSchema,
//   type StripeProduct,
// } from "@/types/admin";
import { Package, ShoppingCart } from "lucide-react";
// import { StripeProduct } from "@/types/product";
import { PackFormData, packSchema } from "@/lib/product/product.schema";
import { StripeProduct } from "@/types/product";

interface EnhancedPackFormProps {
  products: StripeProduct[];
  onSubmit: (data: PackFormData) => void;
  isLoading?: boolean;
}

export function EnhancedPackForm({
  products,
  onSubmit,
  isLoading,
}: EnhancedPackFormProps) {
  const form = useForm<PackFormData>({
    resolver: zodResolver(packSchema),
    defaultValues: {
      productIds: [],
      packPrice: 0,
      discount: 0,
    },
  });

  const selectedProducts = form.watch("productIds");

  const formatPrice = (amount: number, currency: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  };

  const calculateSuggestedPrice = () => {
    const selected = products.filter((p) => selectedProducts.includes(p.id));
    const total = selected.reduce((sum, product) => {
      if (product.default_price && typeof product.default_price === 'object' && product.default_price.unit_amount !== null) {
        return sum + product.default_price.unit_amount;
      }
      return sum;
    }, 0);
    return total;
  };

  const suggestedPrice = calculateSuggestedPrice();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Create Product Pack
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
                  <FormLabel>Pack Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., 3-Coffee Starter Pack"
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
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe your pack..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Product Selection */}
            <FormField
              control={form.control}
              name="productIds"
              render={() => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <ShoppingCart className="h-4 w-4" />
                    Select Products for Pack
                  </FormLabel>
                  <div className="space-y-3 max-h-60 overflow-y-auto border rounded-md p-3">
                    {products.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        No products available. Create some products first.
                      </p>
                    ) : (
                      products
                        .filter((p) => !p.metadata || p.metadata.type !== "bundle") // Exclude existing packs
                        .map((product) => (
                          <FormField
                            key={product.id}
                            control={form.control}
                            name="productIds"
                            render={({ field }) => {
                              return (
                                <FormItem
                                  key={product.id}
                                  className="flex flex-row items-start space-x-3 space-y-0"
                                >
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(
                                        product.id
                                      )}
                                      onCheckedChange={(checked) => {
                                        return checked
                                          ? field.onChange([
                                              ...field.value,
                                              product.id,
                                            ])
                                          : field.onChange(
                                              field.value?.filter(
                                                (value) => value !== product.id
                                              )
                                            );
                                      }}
                                    />
                                  </FormControl>
                                  <div className="flex-1 min-w-0">
                                    <FormLabel className="text-sm font-normal cursor-pointer">
                                      {product.name}
                                    </FormLabel>
                                    {product.default_price && typeof product.default_price === 'object' && product.default_price.unit_amount !== null && (
                                      <p className="text-xs text-muted-foreground">
                                        {formatPrice(
                                          product.default_price.unit_amount,
                                          product.default_price.currency
                                        )}
                                      </p>
                                    )}
                                  </div>
                                </FormItem>
                              );
                            }}
                          />
                        ))
                    )}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Selected Products Summary */}
            {selectedProducts.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">
                    Selected Products:
                  </span>
                  <Badge variant="secondary">
                    {selectedProducts.length} items
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-1">
                  {products
                    .filter((p) => selectedProducts.includes(p.id))
                    .map((product) => (
                      <Badge
                        key={product.id}
                        variant="outline"
                        className="text-xs"
                      >
                        {product.name}
                      </Badge>
                    ))}
                </div>
                {suggestedPrice > 0 && (
                  <p className="text-sm text-muted-foreground">
                    Individual total: {formatPrice(suggestedPrice, "usd")}
                  </p>
                )}
              </div>
            )}

            <FormField
              control={form.control}
              name="packPrice"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pack Price (cents)</FormLabel>
                  <FormControl>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        placeholder="2400"
                        {...field}
                        onChange={(e) =>
                          field.onChange(Number.parseInt(e.target.value) || 0)
                        }
                      />
                      {suggestedPrice > 0 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => field.onChange(suggestedPrice)}
                        >
                          Use Individual Total
                        </Button>
                      )}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || selectedProducts.length === 0}
            >
              {isLoading ? "Creating Pack..." : "Create Pack"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
