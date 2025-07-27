/* eslint-disable @typescript-eslint/no-unused-vars */
"use client"
import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import {
  createCoupon,
  updateCoupon,
  createPresetCoupon,
  listProducts,
  listCoupons,
} from "@/lib/product/crud"
import { toast } from "sonner"
import { EnhancedCouponForm } from "../_components/form/coupon-form"
import { StripeCoupon } from "@/types/product"
import { CouponFormData } from "@/lib/product/product.schema"
import { CouponOnlyList } from "../_components/coupon-only-list";

export default function CouponManagementPage() {
  const queryClient = useQueryClient()
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

  // Mutations
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

  const onCouponSubmit = (data: CouponFormData) => {
    if (editingCoupon) {
      handleUpdateCoupon({ id: editingCoupon.id, data })
    } else {
      handleCreateCoupon(data)
    }
  }

  const handleEditCoupon = (coupon: StripeCoupon) => {
    setEditingCoupon(coupon)
  }

  const onCancelEdit = () => {
    setEditingCoupon(null)
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
        <h1 className="text-3xl font-bold tracking-tight">Coupon Management</h1>
        <p className="text-muted-foreground">Create and manage discount coupons for your store</p>
      </div>

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
        <CouponOnlyList
          coupons={coupons || []}
          onEdit={handleEditCoupon}
          isLoading={creatingCoupon || updatingCoupon || creatingPresetCoupon}
          title="Coupon Management"
          description="Create and manage discount coupons for your store"
        />
      </div>
    </div>
  )
}
