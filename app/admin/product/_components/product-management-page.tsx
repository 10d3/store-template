/* eslint-disable @typescript-eslint/no-unused-vars */
"use client"
import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import {
    createProduct,
    updateProduct,
    archiveProduct,
    listProducts,
    listCoupons,
} from "@/lib/product/crud"
import { toast } from "sonner"
import ProductForm from "../../_components/form/product-form"
import { StripeProduct } from "@/types/product"
import { ProductFormData } from "@/lib/product/product.schema"
import { ProductOnlyList } from "../../_components/product-only-list";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"

export default function ProductManagementPage() {
    const queryClient = useQueryClient()
    const [editingProduct, setEditingProduct] = useState<StripeProduct | null>(null)
    const [isDialogOpen, setIsDialogOpen] = useState(false)

    // Queries
    const { data: products = [], isLoading: productsLoading } = useQuery({
        queryKey: ["products"],
        queryFn: listProducts,
    })

    // Filter out packs to show only regular products
    const regularProducts = products.filter(p => p.metadata?.type !== 'pack')

    // Mutations
    const { mutate: handleCreateProduct, isPending: creatingProduct } = useMutation({
        mutationFn: createProduct,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["products"] })
            toast.success("Product created successfully")
            setIsDialogOpen(false)
        },
        onError: (error) => {
            toast.error("Failed to create product")
            console.error(error)
        },
    })

    const { mutate: handleUpdateProduct, isPending: updatingProduct } = useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<ProductFormData> }) => updateProduct(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["products"] })
            setEditingProduct(null)
            setIsDialogOpen(false)
            toast.success("Product updated successfully")
        },
        onError: (error) => {
            toast.error("Failed to update product")
            console.error(error)
        },
    })

    const { mutate: handleArchiveProduct } = useMutation({
        mutationFn: archiveProduct,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["products"] })
            toast.success("Product archived successfully")
        },
        onError: (error) => {
            toast.error("Failed to archive product")
            console.error(error)
        },
    })

    const onProductSubmit = (data: ProductFormData) => {
        if (editingProduct) {
            handleUpdateProduct({ id: editingProduct.id, data })
        } else {
            handleCreateProduct(data)
        }
    }

    const onEditProduct = (product: StripeProduct) => {
        setEditingProduct(product)
        setIsDialogOpen(true)
    }

    const startCreateProduct = () => {
        setEditingProduct(null)
        setIsDialogOpen(true)
    }

    const onCancelEdit = () => {
        setEditingProduct(null)
        setIsDialogOpen(false)
    }

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
                    <h1 className="text-3xl font-bold tracking-tight">Product Management</h1>
                    <p className="text-muted-foreground">Create, edit, and manage your products</p>
                </div>
                <Button onClick={startCreateProduct}>
                    Create New Product
                </Button>
            </div>

            <div className="grid gap-6">
                <ProductOnlyList
                    products={products || []}
                    onEdit={onEditProduct}
                    onArchive={handleArchiveProduct}
                    isLoading={creatingProduct || updatingProduct}
                    title="Product List"
                    description="Manage your individual products here"
                />
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editingProduct ? "Edit Product" : "Create New Product"}</DialogTitle>
                    </DialogHeader>
                    <ProductForm
                        onSubmit={onProductSubmit}
                        initialData={editingProduct || undefined}
                        isLoading={creatingProduct || updatingProduct}
                        products={products}
                        embed
                    />
                </DialogContent>
            </Dialog>
        </div>
    )
}
