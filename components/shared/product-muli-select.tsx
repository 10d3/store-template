import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { StripeProduct } from "@/types/product";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { Button } from "../ui/button";
import { Check, ChevronsUpDown, Search, ShoppingCart, X } from "lucide-react";
import { Badge } from "../ui/badge";

interface ProductSelectProps {
  products: StripeProduct[];
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
}

export default function ProductMultiSelect({
  products,
  selectedIds,
  onSelectionChange,
}: ProductSelectProps) {
  const [open, setOpen] = useState(false);

  const formatPrice = (amount: number, currency: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  };

  const availableProducts = products.filter(
    (p) => !p.metadata || p.metadata.type !== "bundle"
  );

  const selectedProducts = availableProducts.filter((p) =>
    selectedIds.includes(p.id)
  );
  const unselectedProducts = availableProducts.filter(
    (p) => !selectedIds.includes(p.id)
  );

  const handleSelect = (productId: string) => {
    if (selectedIds.includes(productId)) {
      onSelectionChange(selectedIds.filter((id) => id !== productId));
    } else {
      onSelectionChange([...selectedIds, productId]);
    }
  };

  const removeProduct = (productId: string) => {
    onSelectionChange(selectedIds.filter((id) => id !== productId));
  };

  return (
    <div className="space-y-4">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between h-auto min-h-[2.5rem] p-3 border-2 hover:border-blue-300 transition-colors bg-transparent"
          >
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              <span className="">
                {selectedIds.length > 0
                  ? `${selectedIds.length} product${selectedIds.length === 1 ? "" : "s"} selected`
                  : "Search and select products..."}
              </span>
            </div>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command className="w-full">
            <CommandInput placeholder="Search products..." className="h-9" />
            <CommandEmpty>No products found.</CommandEmpty>
            <CommandList className="max-h-64">
              <CommandGroup className="w-full">
                {unselectedProducts.map((product) => (
                  <CommandItem
                    key={product.id}
                    value={`${product.name} ${product.id}`}
                    onSelect={() => handleSelect(product.id)}
                    className="flex w-full items-center justify-between p-3 cursor-pointer hover:bg-blue-50"
                  >
                    <div className="flex items-center gap-3 w-full">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{product.name}</p>
                        {product.default_price &&
                          typeof product.default_price === "object" &&
                          product.default_price.unit_amount !== null && (
                            <p className="text-xs text-gray-500">
                              {formatPrice(
                                product.default_price.unit_amount,
                                product.default_price.currency
                              )}
                            </p>
                          )}
                      </div>
                    </div>
                    <Check className="h-4 w-4 opacity-0" />
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Selected Products */}
      <AnimatePresence>
        {selectedProducts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-3"
          >
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              <span className="text-sm font-medium">Selected Products</span>
              <Badge variant="secondary">{selectedProducts.length}</Badge>
            </div>

            <div className="grid gap-2">
              {selectedProducts.map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                  className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg group hover:bg-blue-100 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">
                      {product.name}
                    </p>
                    {product.default_price &&
                      typeof product.default_price === "object" &&
                      product.default_price.unit_amount !== null && (
                        <p className="text-xs">
                          {formatPrice(
                            product.default_price.unit_amount,
                            product.default_price.currency
                          )}
                        </p>
                      )}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeProduct(product.id)}
                    className="h-6 w-6 text-gray-500 hover:text-red-600 hover:bg-red-100 opacity-0 group-hover:opacity-100 transition-all duration-200"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
