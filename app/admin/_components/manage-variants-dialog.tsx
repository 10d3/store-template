"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, Loader2, Plus, Save, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  createVariant,
  updateVariant,
  archiveVariant,
  reorderVariants,
} from "@/lib/catalog";
import { listProductVariants } from "@/lib/admin/catalog-admin";
import type { VariantData } from "@/lib/catalog";

interface ManageVariantsDialogProps {
  productId: string;
  productName: string;
  trackInventory?: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type VariantRowData = VariantData;

export default function ManageVariantsDialog({
  productId,
  productName,
  open,
  onOpenChange,
}: ManageVariantsDialogProps) {
  const qc = useQueryClient();
  const [label, setLabel] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [sku, setSku] = useState("");

  const { data: variants = [], isLoading } = useQuery<VariantRowData[]>({
    queryKey: ["product-variants", productId],
    queryFn: () => listProductVariants(productId),
    enabled: open,
  });

  const invalidate = () =>
    qc.invalidateQueries({ queryKey: ["product-variants", productId] });

  const create = useMutation({
    mutationFn: () =>
      createVariant(productId, {
        options: label.trim() ? { label: label.trim() } : {},
        price: Math.round((Number(price) || 0) * 100),
        stock: Number(stock) || 0,
        sku: sku.trim() || undefined,
      }),
    onSuccess: (result) => {
      if (!result.success) {
        toast.error(result.error ?? "Failed to create variant");
        return;
      }
      toast.success("Variant created");
      setLabel("");
      setPrice("");
      setStock("");
      setSku("");
      invalidate();
    },
    onError: () => toast.error("Failed to create variant"),
  });

  const remove = useMutation({
    mutationFn: (variantId: string) => archiveVariant(variantId),
    onSuccess: (result) => {
      if (!result.success) {
        toast.error(result.error ?? "Failed to archive variant");
        return;
      }
      toast.success("Variant archived");
      invalidate();
    },
    onError: () => toast.error("Failed to archive variant"),
  });

  const reorder = useMutation({
    mutationFn: (orderedIds: string[]) => reorderVariants(orderedIds),
    onSuccess: (result) => {
      if (!result.success) {
        toast.error(result.error ?? "Failed to reorder variants");
        return;
      }
      invalidate();
    },
    onError: () => toast.error("Failed to reorder variants"),
  });

  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= variants.length) return;
    const ordered = variants.map((v) => v.id);
    const [moved] = ordered.splice(index, 1);
    ordered.splice(target, 0, moved);
    reorder.mutate(ordered);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="min-w-7xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Variants — {productName}</DialogTitle>
          <DialogDescription>
            Manage pricing, stock and inventory tracking per variant. Pricing is
            stored on each variant (cents).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="rounded-md border">
            {isLoading ? (
              <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading variants…
              </div>
            ) : variants.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                No variants yet.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[70px]">Order</TableHead>
                    <TableHead>Variant</TableHead>
                    <TableHead className="w-[110px]">Price</TableHead>
                    <TableHead className="w-[90px]">Stock</TableHead>
                    <TableHead className="w-[120px]">SKU</TableHead>
                    <TableHead className="w-[90px]">Track</TableHead>
                    <TableHead className="w-[90px]">Status</TableHead>
                    <TableHead className="w-[100px] text-right">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {variants.map((variant, index) => (
                    <VariantRow
                      key={variant.id}
                      variant={variant}
                      index={index}
                      total={variants.length}
                      onSaved={invalidate}
                      onDelete={() => remove.mutate(variant.id)}
                      onMove={move}
                      deleting={remove.isPending && remove.variables === variant.id}
                      moving={reorder.isPending}
                    />
                  ))}
                </TableBody>
              </Table>
            )}
          </div>

          <div className="space-y-3 rounded-md border p-4">
            <p className="text-sm font-medium">Add variant</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="col-span-2 space-y-1.5">
                <Label htmlFor="new-variant-label">Label</Label>
                <Input
                  id="new-variant-label"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="e.g. Medium"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="new-variant-price">Price ($)</Label>
                <Input
                  id="new-variant-price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="new-variant-stock">Stock</Label>
                <Input
                  id="new-variant-stock"
                  type="number"
                  min="0"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label htmlFor="new-variant-sku">SKU</Label>
                <Input
                  id="new-variant-sku"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                />
              </div>
              <div className="col-span-2 flex items-end">
                <Button
                  type="button"
                  size="sm"
                  onClick={() => create.mutate()}
                  disabled={create.isPending || !price}
                  className="w-full gap-2"
                >
                  {create.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                  Add
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface VariantRowProps {
  variant: VariantRowData;
  index: number;
  total: number;
  onSaved: () => void;
  onDelete: () => void;
  onMove: (index: number, direction: -1 | 1) => void;
  deleting: boolean;
  moving: boolean;
}

function VariantRow({
  variant,
  index,
  total,
  onSaved,
  onDelete,
  onMove,
  deleting,
  moving,
}: VariantRowProps) {
  const [label, setLabel] = useState(variant.options?.label ?? "");
  const [price, setPrice] = useState((variant.price / 100).toString());
  const [stock, setStock] = useState(variant.stock.toString());
  const [sku, setSku] = useState(variant.sku ?? "");
  const [track, setTrack] = useState(variant.trackInventory);

  const save = useMutation({
    mutationFn: () => {
      const priceCents = Math.round((Number(price) || 0) * 100);
      const priceChanged = priceCents !== variant.price;
      return updateVariant(variant.id, {
        options: { ...variant.options, label: label.trim() },
        stock: Number(stock) || 0,
        sku: sku.trim() || null,
        ...(priceChanged && { price: priceCents }),
      });
    },
    onSuccess: (result) => {
      if (!result.success) {
        toast.error(result.error ?? "Failed to save variant");
        return;
      }
      toast.success("Variant saved");
      onSaved();
    },
    onError: () => toast.error("Failed to save variant"),
  });

  const toggleTrack = useMutation({
    mutationFn: (enabled: boolean) =>
      updateVariant(variant.id, { trackInventory: enabled }),
    onSuccess: (result, enabled) => {
      if (!result.success) {
        toast.error(result.error ?? "Failed to update inventory tracking");
        setTrack(!enabled);
        return;
      }
      toast.success(
        enabled ? "Inventory tracking enabled" : "Inventory tracking disabled",
      );
      onSaved();
    },
    onError: (_error, enabled) => {
      toast.error("Failed to update inventory tracking");
      setTrack(!enabled);
    },
  });

  const handleTrackChange = (enabled: boolean) => {
    setTrack(enabled);
    toggleTrack.mutate(enabled);
  };

  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-1">
          <span className="w-4 text-sm text-muted-foreground">{index + 1}</span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => onMove(index, -1)}
            disabled={index === 0 || moving}
            aria-label="Move variant up"
          >
            <ArrowUp className="h-3.5 w-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => onMove(index, 1)}
            disabled={index === total - 1 || moving}
            aria-label="Move variant down"
          >
            <ArrowDown className="h-3.5 w-3.5" />
          </Button>
        </div>
      </TableCell>
      <TableCell>
        <Input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Label"
          className="h-8"
        />
      </TableCell>
      <TableCell>
        <Input
          type="number"
          step="0.01"
          min="0"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className="h-8"
        />
      </TableCell>
      <TableCell>
        <Input
          type="number"
          min="0"
          value={stock}
          onChange={(e) => setStock(e.target.value)}
          className="h-8"
        />
      </TableCell>
      <TableCell>
        <Input
          value={sku}
          onChange={(e) => setSku(e.target.value)}
          className="h-8"
        />
      </TableCell>
      <TableCell>
        <Switch
          checked={track}
          onCheckedChange={handleTrackChange}
          disabled={toggleTrack.isPending}
          aria-label="Track inventory for this variant"
        />
      </TableCell>
      <TableCell>
        {variant.active ? (
          <Badge variant="secondary">Active</Badge>
        ) : (
          <Badge variant="outline">Archived</Badge>
        )}
      </TableCell>
      <TableCell>
        <div className="flex items-center justify-end gap-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => save.mutate()}
            disabled={save.isPending}
          >
            {save.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={onDelete}
            disabled={deleting}
          >
            {deleting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}
