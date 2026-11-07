/* eslint-disable @typescript-eslint/no-unused-vars */
"use client"
import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import {
    archiveProduct,
    listProducts,
    unarchiveProduct,
    getArchivedProducts,
} from "@/lib/admin/catalog-admin"
import { toast } from "sonner"
import { type ProductWithVariants } from "@/lib/catalog"
import { ProductOnlyList } from "../../_components/product-only-list";
import ManageVariantsDialog from "../../_components/manage-variants-dialog";

export default function ProductManagementPage() {
    const queryClient = useQueryClient()
    const router = useRouter()
    const [variantsProduct, setVariantsProduct] = useState<ProductWithVariants | null>(null)

    // Queries
    const { data: products = [], isLoading: productsLoading } = useQuery({
        queryKey: ["products"],
        queryFn: listProducts,
    })

    // Filter out packs to show only regular products
    const regularProducts = products.filter(p => !p.isBundle)

    // Archived products query
    const { data: archivedProducts = [], isLoading: archivedLoading } = useQuery({
        queryKey: ["archived-products"],
        queryFn: getArchivedProducts,
    })

    // Mutations
    const { mutate: handleArchiveProduct } = useMutation({
        mutationFn: archiveProduct,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["products"] })
            queryClient.invalidateQueries({ queryKey: ["archived-products"] })
            toast.success("Product archived successfully")
        },
        onError: (error) => {
            toast.error("Failed to archive product")
            console.error(error)
        },
    })

    const { mutate: handleUnarchiveProduct } = useMutation({
        mutationFn: unarchiveProduct,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["products"] })
            queryClient.invalidateQueries({ queryKey: ["archived-products"] })
            toast.success("Product unarchived successfully")
        },
        onError: (error) => {
            toast.error("Failed to unarchive product")
            console.error(error)
        },
    })

    const onEditProduct = (product: ProductWithVariants) => {
        router.push(`/admin/product/${product.id}/edit`)
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
                <Button asChild>
                    <Link href="/admin/product/new">Create New Product</Link>
                </Button>
            </div>

            <div className="grid gap-6">
                <ProductOnlyList
                    products={products || []}
                    onEdit={onEditProduct}
                    onArchive={handleArchiveProduct}
                    onUnarchive={handleUnarchiveProduct}
                    onManageVariants={setVariantsProduct}
                    isLoading={productsLoading}
                    title="Active Products"
                    description="Manage your individual products here"
                />

                <ProductOnlyList
                    products={archivedProducts || []}
                    onEdit={onEditProduct}
                    onArchive={handleArchiveProduct}
                    onUnarchive={handleUnarchiveProduct}
                    isLoading={archivedLoading}
                    title="Archived Products"
                    description="These products are hidden from the storefront. Unarchive to restore them."
                    isArchived
                />
            </div>

            {variantsProduct && (
                <ManageVariantsDialog
                    productId={variantsProduct.id}
                    productName={variantsProduct.name}
                    trackInventory={variantsProduct.defaultVariant?.trackInventory ?? false}
                    open={!!variantsProduct}
                    onOpenChange={(o) => !o && setVariantsProduct(null)}
                />
            )}
        </div>
    )
}
