"use client";

import ProductMultiSelect from "@/components/shared/product-muli-select";
import { StripeProduct } from "@/types/product";
import { FormControl, FormDescription, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Link2 } from "lucide-react";

interface RelatedProductsSelectorProps {
    products: StripeProduct[];
    value: string; // Comma-separated product IDs
    onChange: (value: string) => void;
    currentProductId?: string; // Exclude current product from options
}

export default function RelatedProductsSelector({
    products,
    value,
    onChange,
    currentProductId,
}: RelatedProductsSelectorProps) {
    // Parse comma-separated IDs into array
    const selectedIds = value
        ? value.split(",").map((id) => id.trim()).filter(Boolean)
        : [];

    // Filter out current product and bundles
    const availableProducts = products.filter(
        (p) =>
            p.id !== currentProductId &&
            (!p.metadata || p.metadata.type !== "bundle")
    );

    // Handle selection change - convert array back to comma-separated string
    const handleSelectionChange = (ids: string[]) => {
        onChange(ids.join(","));
    };

    return (
        <FormItem>
            <FormLabel className="flex items-center gap-2 text-sm font-medium">
                <Link2 className="w-4 h-4" />
                Related Products
            </FormLabel>
            <FormControl>
                <ProductMultiSelect
                    products={availableProducts}
                    selectedIds={selectedIds}
                    onSelectionChange={handleSelectionChange}
                />
            </FormControl>
            <FormDescription className="text-xs">
                Select products to show as "You may also like" on this product page.
                Leave empty to auto-show products from the same category.
            </FormDescription>
            <FormMessage />
        </FormItem>
    );
}
