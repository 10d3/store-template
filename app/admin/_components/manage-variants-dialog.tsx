"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Trash2, Save, Loader2 } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  listProductVariants,
  createProductVariant,
  updateProductVariant,
  deleteProductVariant,
  setProductTrackInventory,
} from "@/lib/product/variants";
import type { ProductVariantData } from "@/types/product";

export default function ManageVariantsDialog({
  productId,
  productName,
  trackInventory,
  open,
  onOpenChange,
}: {
  productId: string;
  productName: string;
  trackInventory: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const qc = useQueryClient();
  const [track, setTrack] = useState(trackInventory);

  // New-variant form
  const [label, setLabel] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("0");
  const [sku, setSku] = useState("");

  const { data: variants = [], isLoading } = useQuery({
    queryKey: ["product-variants", productId],
    queryFn: () => listProductVariants(productId),
    enabled: open,
  });

  const invalidate = () =>
    qc.invalidateQueries({ queryKey: ["product-variants", productId] });

  const toggleTrack = useMutation({
    mutationFn: (enabled: boolean) =>
      setProductTrackInventory(productId, enabled),
    onSuccess: (_d, enabled) => {
      setTrack(enabled);
      toast.success(enabled ? "Variant selector enabled" : "Disabled");
    },
    onError: () => toast.error("Failed to update setting"),
  });

  const create = useMutation({
    mutationFn: () =>
      createProductVariant(productId, {
        options: label.trim() ? { label: label.trim() } : {},
        priceCents: Math.round((Number(price) || 0) * 100),
        stock: Number(stock) || 0,
        sku: sku.trim() || undefined,
      }),
    onSuccess: () => {
      toast.success("Variant added");
      setLabel("");
      setPrice("");
      setStock("0");
      setSku("");
      invalidate();
    },
    onError: (e: unknown) =>
      toast.error(e instanceof Error ? e.message : "Failed to add variant"),
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteProductVariant(id),
    onSuccess: () => {
      toast.success("Variant removed");
      invalidate();
    },
    onError: () => toast.error("Failed to remove variant"),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Variants — {productName}</DialogTitle>
          <DialogDescription>
            Manage size/color/option variants, stock, and price.
          </DialogDescription>
        </DialogHeader>

        {/* Storefront toggle */}
        <div className="flex items-center justify-between rounded-lg border p-3">
          <div>
            <p className="text-sm font-medium">Show variant selector on storefront</p>
            <p className="text-xs text-muted-foreground">
              Enables the variant picker + inventory enforcement for this product.
            </p>
          </div>
          <Switch
            checked={track}
            disabled={toggleTrack.isPending}
            onCheckedChange={(v) => toggleTrack.mutate(v)}
          />
        </div>

        {/* Existing variants */}
        <div className="space-y-2 max-h-[320px] overflow-y-auto">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : variants.length === 0 ? (
            <p className="text-sm text-muted-foreground">No variants yet.</p>
          ) : (
            variants.map((v) => (
              <VariantRow
                key={v.id}
                variant={v}
                onSaved={invalidate}
                onDelete={() => remove.mutate(v.id)}
                deleting={remove.isPending && remove.variables === v.id}
              />
            ))
          )}
        </div>

        {/* Add variant */}
        <div className="rounded-lg border p-3 space-y-3">
          <p className="text-sm font-medium">Add variant</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="col-span-2">
              <Label className="text-xs">Label (e.g. Large / Red)</Label>
              <Input value={label} onChange={(e) => setLabel(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Price ($)</Label>
              <Input
                type="number"
                min={0}
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </div>
            <div>
              <Label className="text-xs">Stock</Label>
              <Input
                type="number"
                min={0}
                value={stock}
                onChange={(e) => setStock(e.target.value)}
              />
            </div>
            <div className="col-span-2">
              <Label className="text-xs">SKU (optional)</Label>
              <Input value={sku} onChange={(e) => setSku(e.target.value)} />
            </div>
          </div>
          <Button
            size="sm"
            disabled={create.isPending || !price}
            onClick={() => create.mutate()}
          >
            {create.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            Add variant
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function VariantRow({
  variant,
  onSaved,
  onDelete,
  deleting,
}: {
  variant: ProductVariantData;
  onSaved: () => void;
  onDelete: () => void;
  deleting: boolean;
}) {
  const [label, setLabel] = useState(variant.options?.label ?? "");
  const [price, setPrice] = useState(
    variant.unit_amount != null ? (variant.unit_amount / 100).toString() : ""
  );
  const [stock, setStock] = useState(variant.stock.toString());

  const save = useMutation({
    mutationFn: () => {
      const priceCents = Math.round((Number(price) || 0) * 100);
      const priceChanged = priceCents !== (variant.unit_amount ?? 0);
      return updateProductVariant(variant.id, {
        options: { label: label.trim() },
        stock: Number(stock) || 0,
        ...(priceChanged && { priceCents }),
      });
    },
    onSuccess: () => {
      toast.success("Variant saved");
      onSaved();
    },
    onError: () => toast.error("Failed to save variant"),
  });

  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 items-end border rounded-md p-2">
      <div className="col-span-2">
        <Label className="text-xs">Label</Label>
        <Input value={label} onChange={(e) => setLabel(e.target.value)} />
      </div>
      <div>
        <Label className="text-xs">Price ($)</Label>
        <Input
          type="number"
          min={0}
          step="0.01"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
        />
      </div>
      <div>
        <Label className="text-xs">Stock</Label>
        <Input
          type="number"
          min={0}
          value={stock}
          onChange={(e) => setStock(e.target.value)}
        />
      </div>
      <div className="flex gap-1">
        <Button size="sm" disabled={save.isPending} onClick={() => save.mutate()}>
          {save.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
        </Button>
        <Button
          size="sm"
          variant="destructive"
          disabled={deleting}
          onClick={onDelete}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
