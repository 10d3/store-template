"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, Check, Loader2, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  addBundleItem,
  removeBundleItem,
  type BundleItemData,
} from "@/lib/catalog";
import {
  getBundleItems,
  reorderBundleItems,
  updateBundleItem,
} from "@/lib/admin/catalog-admin";
import { cn } from "@/lib/utils";
import type { ProductWithVariants } from "@/lib/catalog";

export interface BundleComponentValue {
  /** BundleItem id when the row is already persisted. */
  id?: string;
  componentProductId: string;
  componentVariantId: string | null;
  quantity: number;
  position: number;
}

interface BundleComponentPickerProps {
  /** Candidate component products (bundles are filtered out automatically). */
  products: ProductWithVariants[];
  /** Controlled selection used when no bundleProductId is supplied. */
  value?: BundleComponentValue[];
  onChange?: (next: BundleComponentValue[]) => void;
  /**
   * When provided the picker loads and persists real `BundleItem` rows for this
   * bundle product via the catalog/admin mutations.
   */
  bundleProductId?: string;
  disabled?: boolean;
  label?: string;
  description?: string;
  className?: string;
}

const NO_VARIANT = "__none__";

function formatPrice(amount: number | null | undefined, currency = "usd") {
  if (amount == null) return "—";
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
    }).format(amount / 100);
  } catch {
    return `$${(amount / 100).toFixed(2)}`;
  }
}

function bundleItemToValue(item: BundleItemData): BundleComponentValue {
  return {
    id: item.id,
    componentProductId: item.componentProduct.id,
    componentVariantId: item.componentVariant?.id ?? null,
    quantity: item.quantity,
    position: item.position,
  };
}

export function BundleComponentPicker({
  products,
  value,
  onChange,
  bundleProductId,
  disabled = false,
  label = "Bundle components",
  description,
  className,
}: BundleComponentPickerProps) {
  const queryClient = useQueryClient();
  const isPersisted = Boolean(bundleProductId);
  const [pickerOpen, setPickerOpen] = useState(false);

  const { data: serverItems, isLoading } = useQuery({
    queryKey: ["bundle-items", bundleProductId],
    queryFn: () => getBundleItems(bundleProductId as string),
    enabled: isPersisted,
  });

  const items: BundleComponentValue[] = useMemo(() => {
    if (isPersisted) {
      return (serverItems ?? []).map(bundleItemToValue);
    }
    return value ?? [];
  }, [isPersisted, serverItems, value]);

  const productById = useMemo(() => {
    const map = new Map<string, ProductWithVariants>();
    for (const product of products) map.set(product.id, product);
    return map;
  }, [products]);

  const availableProducts = useMemo(() => {
    const selected = new Set(items.map((item) => item.componentProductId));
    return products.filter(
      (product) => !product.isBundle && !selected.has(product.id),
    );
  }, [products, items]);

  const emit = (next: BundleComponentValue[]) => {
    onChange?.(
      next.map((item, index) => ({
        ...item,
        position: index,
      })),
    );
  };

  const invalidate = () => {
    if (bundleProductId) {
      queryClient.invalidateQueries({
        queryKey: ["bundle-items", bundleProductId],
      });
    }
  };

  const addMutation = useMutation({
    mutationFn: (input: {
      componentProductId: string;
      componentVariantId: string | null;
      quantity: number;
      position: number;
    }) => addBundleItem(bundleProductId as string, input),
    onSuccess: (result) => {
      if (!result.success) {
        toast.error(result.error ?? "Failed to add component");
        return;
      }
      toast.success("Component added");
      invalidate();
    },
    onError: () => toast.error("Failed to add component"),
  });

  const removeMutation = useMutation({
    mutationFn: (itemId: string) => removeBundleItem(itemId),
    onSuccess: (result) => {
      if (!result.success) {
        toast.error(result.error ?? "Failed to remove component");
        return;
      }
      toast.success("Component removed");
      invalidate();
    },
    onError: () => toast.error("Failed to remove component"),
  });

  const updateMutation = useMutation({
    mutationFn: (input: { id: string; quantity?: number; position?: number }) =>
      updateBundleItem(input.id, {
        quantity: input.quantity,
        position: input.position,
      }),
    onSuccess: (result) => {
      if (!result.success) {
        toast.error(result.error ?? "Failed to update component");
        return;
      }
      invalidate();
    },
    onError: () => toast.error("Failed to update component"),
  });

  const reorderMutation = useMutation({
    mutationFn: (orderedIds: string[]) =>
      reorderBundleItems(bundleProductId as string, orderedIds),
    onSuccess: (result) => {
      if (!result.success) {
        toast.error(result.error ?? "Failed to reorder components");
        return;
      }
      invalidate();
    },
    onError: () => toast.error("Failed to reorder components"),
  });

  const handleAdd = (product: ProductWithVariants) => {
    setPickerOpen(false);
    const componentVariantId = product.variants?.[0]?.id ?? null;
    if (isPersisted) {
      addMutation.mutate({
        componentProductId: product.id,
        componentVariantId,
        quantity: 1,
        position: items.length,
      });
      return;
    }
    emit([
      ...items,
      {
        componentProductId: product.id,
        componentVariantId,
        quantity: 1,
        position: items.length,
      },
    ]);
  };

  const handleRemove = (item: BundleComponentValue) => {
    if (isPersisted && item.id) {
      removeMutation.mutate(item.id);
      return;
    }
    emit(items.filter((candidate) => candidate !== item));
  };

  const handleQuantity = (item: BundleComponentValue, raw: string) => {
    const quantity = Math.max(1, Math.round(Number(raw) || 1));
    if (isPersisted && item.id) {
      updateMutation.mutate({ id: item.id, quantity });
      return;
    }
    emit(
      items.map((candidate) =>
        candidate === item ? { ...candidate, quantity } : candidate,
      ),
    );
  };

  const handleVariant = (item: BundleComponentValue, variantId: string) => {
    const nextVariantId = variantId === NO_VARIANT ? null : variantId;
    if (isPersisted && item.id) {
      removeMutation.mutate(item.id, {
        onSuccess: (result) => {
          if (!result.success) return;
          addMutation.mutate({
            componentProductId: item.componentProductId,
            componentVariantId: nextVariantId,
            quantity: item.quantity,
            position: item.position,
          });
        },
      });
      return;
    }
    emit(
      items.map((candidate) =>
        candidate === item
          ? { ...candidate, componentVariantId: nextVariantId }
          : candidate,
      ),
    );
  };

  const handleMove = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    if (isPersisted) {
      const orderedIds = next
        .map((item) => item.id)
        .filter((id): id is string => Boolean(id));
      if (orderedIds.length === next.length) {
        reorderMutation.mutate(orderedIds);
      }
      emit(next);
      return;
    }
    emit(next);
  };

  const isBusy =
    addMutation.isPending ||
    removeMutation.isPending ||
    updateMutation.isPending ||
    reorderMutation.isPending;

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-sm font-medium leading-none">{label}</p>
          {description ? (
            <p className="mt-1 text-xs text-muted-foreground">{description}</p>
          ) : null}
        </div>
        <Badge variant="secondary">{items.length} item(s)</Badge>
      </div>

      <div className="rounded-md border divide-y">
        {isLoading && isPersisted ? (
          <div className="flex items-center gap-2 p-4 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading components...
          </div>
        ) : items.length === 0 ? (
          <div className="p-4 text-sm text-muted-foreground">
            No components yet. Add products to build this bundle.
          </div>
        ) : (
          items.map((item, index) => {
            const product = productById.get(item.componentProductId);
            const variantOptions = product?.variants ?? [];
            const selectedVariant = variantOptions.find(
              (variant) => variant.id === item.componentVariantId,
            );
            const defaultUnitAmount = product?.defaultVariant?.price ?? null;
            const unitPrice = selectedVariant?.price ?? defaultUnitAmount;
            return (
              <div
                key={item.id ?? `${item.componentProductId}-${index}`}
                className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {product?.name ?? item.componentProductId}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatPrice(unitPrice)}
                  </p>
                </div>

                {variantOptions.length > 0 ? (
                  <Select
                    value={item.componentVariantId ?? NO_VARIANT}
                    onValueChange={(next) => handleVariant(item, next)}
                    disabled={disabled || isBusy}
                  >
                    <SelectTrigger className="w-full sm:w-40">
                      <SelectValue placeholder="Variant" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NO_VARIANT}>No variant</SelectItem>
                      {variantOptions.map((variant) => (
                        <SelectItem key={variant.id} value={variant.id}>
                          {variant.options?.label ?? variant.sku ?? variant.id}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : null}

                <Input
                  type="number"
                  min={1}
                  value={item.quantity}
                  onChange={(event) => handleQuantity(item, event.target.value)}
                  disabled={disabled || isBusy}
                  className="w-full sm:w-20"
                  aria-label="Quantity"
                />

                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleMove(index, -1)}
                    disabled={disabled || isBusy || index === 0}
                    aria-label="Move up"
                  >
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleMove(index, 1)}
                    disabled={disabled || isBusy || index === items.length - 1}
                    aria-label="Move down"
                  >
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemove(item)}
                    disabled={disabled || isBusy}
                    aria-label="Remove component"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </div>

      <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled || isBusy || availableProducts.length === 0}
          >
            {addMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Plus className="mr-2 h-4 w-4" />
            )}
            Add component
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[320px] p-0" align="start">
          <Command>
            <CommandInput placeholder="Search products..." />
            <CommandList>
              <CommandEmpty>No products found.</CommandEmpty>
              <CommandGroup>
                {availableProducts.map((product) => (
                  <CommandItem
                    key={product.id}
                    value={product.name}
                    onSelect={() => handleAdd(product)}
                  >
                    <Check className="mr-2 h-4 w-4 opacity-0" />
                    <span className="truncate">{product.name}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}

export default BundleComponentPicker;
