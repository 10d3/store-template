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
import { ProductForm } from "../_components/form/product-form"
import { StripeProduct } from "@/types/product"
import { ProductFormData } from "@/lib/product/product.schema"
import { ProductOnlyList } from "../_components/product-only-list";

export default function ProductManagementPage() {
  const queryClient = useQueryClient()
  const [editingProduct, setEditingProduct] = useState<StripeProduct | null>(null)

  // Queries
  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: ["products"],
    queryFn: listProducts,
  })

  const { data: coupons = [], isLoading: couponsLoading } = useQuery({
    queryKey: ["coupons"],
    queryFn: listCoupons,
  })

  // Filter out packs to show only regular products
  const regularProducts = products.filter(p => p.metadata?.type !== 'pack')

  // Mutations
  const { mutate: handleCreateProduct, isPending: creatingProduct } = useMutation({
    mutationFn: createProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] })
      toast.success("Product created successfully")
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
  }

  const onCancelEdit = () => {
    setEditingProduct(null)
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
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

      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <ProductForm
            onSubmit={onProductSubmit}
            initialData={editingProduct || undefined}
            isLoading={creatingProduct || updatingProduct}
          />
          {editingProduct && (
            <div className="mt-4">
              <button onClick={onCancelEdit} className="text-sm text-muted-foreground hover:text-foreground">
                Cancel editing
              </button>
            </div>
          )}
        </div>
        <ProductOnlyList
          products={products || []}
          onEdit={onEditProduct}
          onArchive={handleArchiveProduct}
          isLoading={creatingProduct || updatingProduct}
          title="Product Management"
          description="Manage your individual products here"
        />
      </div>
    </div>
  )
}
