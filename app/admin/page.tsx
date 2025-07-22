"use client"
import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  createProduct,
  updateProduct,
  archiveProduct,
  createCoupon,
  createPack,
  listProducts,
  listCoupons,
} from "@/lib/product/crud"
import { toast } from "sonner"
import { type StripeProduct } from "@/types/product"
import { type ProductFormData } from "@/lib/product/product.schema"
import { ProductList } from "./_components/product-list"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ProductForm } from "./_components/form/product-form"
import { PackForm } from "./_components/form/pack-form"
import { CouponForm } from "./_components/form/coupon-form"
import { CouponList } from "./_components/coupon-list"

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
        <h1 className="text-3xl font-bold tracking-tight">E-commerce Admin</h1>
        <p className="text-muted-foreground">Manage your products, coupons, and product packs</p>
      </div>

      <Tabs defaultValue="products" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="packs">Packs</TabsTrigger>
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
            <ProductList
              products={products}
              onEdit={onEditProduct}
              onArchive={handleArchiveProduct}
              isLoading={productsLoading}
            />
          </div>
        </TabsContent>

        <TabsContent value="packs" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <PackForm onSubmit={handleCreatePack} isLoading={creatingPack} />
            <ProductList
              products={products.filter((p) => p.metadata?.type === "bundle")}
              onEdit={onEditProduct}
              onArchive={handleArchiveProduct}
              isLoading={productsLoading}
            />
          </div>
        </TabsContent>

        <TabsContent value="coupons" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <CouponForm onSubmit={handleCreateCoupon} isLoading={creatingCoupon} />
            <CouponList coupons={coupons} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
