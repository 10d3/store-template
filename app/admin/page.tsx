"use client"
import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  createProduct,
  updateProduct,
  archiveProduct,
  createCoupon,
  updateCoupon,
  createPresetCoupon,
  createPack,
  updatePack,
  listProducts,
  listCoupons,
} from "@/lib/product/crud"
import { toast } from "sonner"
import { ProductForm } from "./_components/form/product-form"
import { StripeProduct, StripeCoupon } from "@/types/product"
import { ProductFormData, PackFormData, CouponFormData } from "@/lib/product/product.schema"
import { UnifiedProductList } from "./_components/product-list"
import { EnhancedPackForm } from "./_components/form/pack-form"
import { EnhancedCouponForm } from "./_components/form/coupon-form"
// import { EnhancedCouponForm } from "./_components/form/coupon-form"

export default function AdminPage() {
  const queryClient = useQueryClient()
  const [editingProduct, setEditingProduct] = useState<StripeProduct | null>(null)
  const [editingPack, setEditingPack] = useState<StripeProduct | null>(null)
  const [editingCoupon, setEditingCoupon] = useState<StripeCoupon | null>(null)

  // Queries
  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: ["products"],
    queryFn: listProducts,
  })

  const { data: coupons = [], isLoading: couponsLoading } = useQuery({
    queryKey: ["coupons"],
    queryFn: listCoupons,
  })

  console.log("coupons", coupons)
  console.log("products", products)

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

  const { mutate: handleUpdateCoupon, isPending: updatingCoupon } = useMutation({
    mutationFn: ({ id, data }: { id: string; data: CouponFormData }) => updateCoupon(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["coupons"] })
      setEditingCoupon(null)
      toast.success("Coupon updated successfully")
    },
    onError: (error) => {
      toast.error("Failed to update coupon")
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

  const { mutate: handleUpdatePack, isPending: updatingPack } = useMutation({
    mutationFn: ({ id, data }: { id: string; data: PackFormData }) => updatePack(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] })
      setEditingPack(null)
      toast.success("Pack updated successfully")
    },
    onError: (error) => {
      toast.error("Failed to update pack")
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

  const onPackSubmit = (data: PackFormData) => {
    if (editingPack) {
      handleUpdatePack({ id: editingPack.id, data })
    } else {
      handleCreatePack(data)
    }
  }

  const onCouponSubmit = (data: CouponFormData) => {
    if (editingCoupon) {
      handleUpdateCoupon({ id: editingCoupon.id, data })
    } else {
      handleCreateCoupon(data)
    }
  }

  const onEditProduct = (product: StripeProduct) => {
    setEditingProduct(product)
    setEditingPack(null) // Clear pack editing when editing product
    setEditingCoupon(null) // Clear coupon editing when editing product
  }

  const onEditPack = (pack: StripeProduct) => {
    setEditingPack(pack)
    setEditingProduct(null) // Clear product editing when editing pack
    setEditingCoupon(null) // Clear coupon editing when editing pack
  }

  const onEditCoupon = (coupon: StripeCoupon) => {
    setEditingCoupon(coupon)
    setEditingProduct(null) // Clear product editing when editing coupon
    setEditingPack(null) // Clear pack editing when editing coupon
  }

  const onCancelEdit = () => {
    setEditingProduct(null)
    setEditingPack(null)
    setEditingCoupon(null)
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
              onEdit={(item) => {
                if ('default_price' in item) {
                  onEditProduct(item as StripeProduct);
                }
              }}
              onArchive={handleArchiveProduct}
              isLoading={productsLoading}
            />
          </div>
        </TabsContent>

        <TabsContent value="packs" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <div>
              <EnhancedPackForm 
                products={products} 
                onSubmit={onPackSubmit} 
                initialData={editingPack || undefined}
                isLoading={creatingPack || updatingPack} 
              />
              {editingPack && (
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
              onEdit={(item) => {
                if ('default_price' in item) {
                  onEditPack(item as StripeProduct);
                }
              }}
              onArchive={handleArchiveProduct}
              isLoading={productsLoading}
            />
          </div>
        </TabsContent>

        <TabsContent value="coupons" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <div>
              <EnhancedCouponForm
                onSubmit={onCouponSubmit}
                onPresetSubmit={handleCreatePresetCoupon}
                initialData={editingCoupon || undefined}
                isLoading={creatingCoupon || updatingCoupon || creatingPresetCoupon}
              />
              {editingCoupon && (
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
               onEdit={(item) => {
                 if ('percent_off' in item || 'amount_off' in item) {
                   onEditCoupon(item as StripeCoupon);
                 }
               }}
               onArchive={handleArchiveProduct}
               isLoading={couponsLoading}
             />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
