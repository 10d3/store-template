/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import {
    createPack,
    updatePack,
    archiveProduct,
    listProducts,
    listCoupons,
} from "@/lib/product/crud";
import { toast } from "sonner";
import { EnhancedPackForm } from "../../_components/form/pack-form";
import { MultiPackForm } from "../../_components/form/multi-pack-form";
import { StripeProduct } from "@/types/product";
import { PackFormData } from "@/lib/product/product.schema";
import { BundleOnlyList } from "../../_components/bundle-only-list";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

export default function BundleManagementPage() {
    const queryClient = useQueryClient();
    const [editingPack, setEditingPack] = useState<StripeProduct | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [formType, setFormType] = useState<"generic" | "multi">("generic");

    // Queries
    const { data: products = [], isLoading: productsLoading } = useQuery({
        queryKey: ["products"],
        queryFn: listProducts,
    });

    // Filter to show only packs
    // const packs = products.filter((p) => p.metadata?.type === "bundle");

    // Mutations
    const { mutate: handleCreatePack, isPending: creatingPack } = useMutation({
        mutationFn: createPack,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["products"] });
            toast.success("Bundle created successfully");
            setIsDialogOpen(false);
        },
        onError: (error) => {
            toast.error("Failed to create bundle");
            console.error(error);
        },
    });

    const { mutate: handleUpdatePack, isPending: updatingPack } = useMutation({
        mutationFn: ({ id, data }: { id: string; data: PackFormData }) =>
            updatePack(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["products"] });
            setEditingPack(null);
            setIsDialogOpen(false);
            toast.success("Bundle updated successfully");
        },
        onError: (error) => {
            toast.error("Failed to update bundle");
            console.error(error);
        },
    });

    const { mutate: handleArchivePack } = useMutation({
        mutationFn: archiveProduct,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["products"] });
            toast.success("Bundle archived successfully");
        },
        onError: (error) => {
            toast.error("Failed to archive bundle");
            console.error(error);
        },
    });

    const onPackSubmit = (data: PackFormData) => {
        console.log("data form bundle form", data)
        if (editingPack) {
            handleUpdatePack({ id: editingPack.id, data });
        } else {
            handleCreatePack(data);
        }
    };

    const handleEditPack = (pack: StripeProduct) => {
        setEditingPack(pack);
        // Determine form type based on pack metadata
        if (pack.metadata?.pack_type === "same_product") {
            setFormType("multi");
        } else {
            setFormType("generic");
        }
        setIsDialogOpen(true);
    };

    const startCreatePack = () => {
        setEditingPack(null);
        setFormType("generic");
        setIsDialogOpen(true);
    };

    const startCreateMultiPack = () => {
        setEditingPack(null);
        setFormType("multi");
        setIsDialogOpen(true);
    };

    const onCancelEdit = () => {
        setEditingPack(null);
        setIsDialogOpen(false);
    };

    return (
        <div className="container mx-auto py-8 px-4">
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-4 mb-4">
                        <Link href="/admin">
                            <Button variant="outline" size="sm">
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Back to Dashboard
                            </Button>
                        </Link>
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight">Bundle Management</h1>
                    <p className="text-muted-foreground">
                        Create and manage product bundles with discounts
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button onClick={startCreateMultiPack} variant="secondary">
                        Create Multi-Pack
                    </Button>
                    <Button onClick={startCreatePack}>
                        Create Custom Bundle
                    </Button>
                </div>
            </div>

            <div className="grid gap-6 w-full">
                <BundleOnlyList
                    products={products || []}
                    onEdit={handleEditPack}
                    onArchive={handleArchivePack}
                    isLoading={creatingPack || updatingPack}
                    title="Bundle List"
                    description="Create and manage product bundles with discounts"
                />
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-6xl min-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>
                            {editingPack
                                ? (formType === "multi" ? "Edit Multi-Pack" : "Edit Bundle")
                                : (formType === "multi" ? "Create Multi-Pack" : "Create New Bundle")
                            }
                        </DialogTitle>
                    </DialogHeader>
                    {formType === "multi" ? (
                        <MultiPackForm
                            products={products}
                            onSubmit={onPackSubmit}
                            initialData={editingPack || undefined}
                            isLoading={creatingPack || updatingPack}
                            embed
                        />
                    ) : (
                        <EnhancedPackForm
                            products={products}
                            onSubmit={onPackSubmit}
                            initialData={editingPack || undefined}
                            isLoading={creatingPack || updatingPack}
                            embed
                        />
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
