"use client"
import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  createProduct,
  updateProduct,
  archiveProduct,
  createCoupon,
  createPresetCoupon,
  createPack,
  listProducts,
  listCoupons,
} from "@/lib/product/crud"
import { toast } from "sonner"
import { ProductForm } from "./_components/form/product-form"
import { StripeProduct } from "@/types/product"
import { ProductFormData } from "@/lib/product/product.schema"
import { UnifiedProductList } from "./_components/product-list"
import { EnhancedPackForm } from "./_components/form/pack-form"
import { EnhancedCouponForm } from "./_components/form/coupon-form"

export default function AdminPage() {
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

  const { mutate: handleCreateCoupon, isPending: creatingCoupon } = useMutation({
    mutationFn: createCoupon,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["coupons"] })
      toast.success("Coupon created successfully")
    },
    onError: (error) => {
      toast.error("Failed to create coupon")
      console.error(error)
    },
  })

  const { mutate: handleCreatePresetCoupon, isPending: creatingPresetCoupon } = useMutation({
    mutationFn: createPresetCoupon,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["coupons"] })
      toast.success("Preset coupon created successfully")
    },
    onError: (error) => {
      toast.error("Failed to create preset coupon")
      console.error(error)
    },
  })

  const { mutate: handleCreatePack, isPending: creatingPack } = useMutation({
    mutationFn: createPack,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] })
      toast.success("Pack created successfully")
    },
    onError: (error) => {
      toast.error("Failed to create pack")
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
        <h1 className="text-3xl font-bold tracking-tight">Store Admin Dashboard</h1>
        <p className="text-muted-foreground">Manage your products, packs, and promotional coupons</p>
      </div>

      <Tabs defaultValue="products" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="packs">Product Packs</TabsTrigger>
          <TabsTrigger value="coupons">Coupons</TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="space-y-6">
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
            <UnifiedProductList
              products={products}
              coupons={coupons}
              onEdit={onEditProduct}
              onArchive={handleArchiveProduct}
              isLoading={productsLoading}
            />
          </div>
        </TabsContent>

        <TabsContent value="packs" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <EnhancedPackForm products={products} onSubmit={handleCreatePack} isLoading={creatingPack} />
            <UnifiedProductList
              products={products}
              coupons={coupons}
              onEdit={onEditProduct}
              onArchive={handleArchiveProduct}
              isLoading={productsLoading}
            />
          </div>
        </TabsContent>

        <TabsContent value="coupons" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <EnhancedCouponForm
              onSubmit={handleCreateCoupon}
              onPresetSubmit={handleCreatePresetCoupon}
              isLoading={creatingCoupon || creatingPresetCoupon}
            />
            <UnifiedProductList
              products={products}
              coupons={coupons}
              onEdit={onEditProduct}
              onArchive={handleArchiveProduct}
              isLoading={couponsLoading}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
