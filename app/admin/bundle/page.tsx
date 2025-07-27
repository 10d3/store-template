/* eslint-disable @typescript-eslint/no-unused-vars */
"use client"
import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import {
  createPack,
  updatePack,
  archiveProduct,
  listProducts,
  listCoupons,
} from "@/lib/product/crud"
import { toast } from "sonner"
import { EnhancedPackForm } from "../_components/form/pack-form"
import { StripeProduct } from "@/types/product"
import { PackFormData } from "@/lib/product/product.schema"
import { BundleOnlyList } from "../_components/bundle-only-list";

export default function BundleManagementPage() {
  const queryClient = useQueryClient()
  const [editingPack, setEditingPack] = useState<StripeProduct | null>(null)

  // Queries
  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: ["products"],
    queryFn: listProducts,
  })

  const { data: coupons = [], isLoading: couponsLoading } = useQuery({
    queryKey: ["coupons"],
    queryFn: listCoupons,
  })

  // Filter to show only packs
  const packs = products.filter(p => p.metadata?.type === 'pack')

  // Mutations
  const { mutate: handleCreatePack, isPending: creatingPack } = useMutation({
    mutationFn: createPack,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] })
      toast.success("Bundle created successfully")
    },
    onError: (error) => {
      toast.error("Failed to create bundle")
      console.error(error)
    },
  })

  const { mutate: handleUpdatePack, isPending: updatingPack } = useMutation({
    mutationFn: ({ id, data }: { id: string; data: PackFormData }) => updatePack(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] })
      setEditingPack(null)
      toast.success("Bundle updated successfully")
    },
    onError: (error) => {
      toast.error("Failed to update bundle")
      console.error(error)
    },
  })

  const { mutate: handleArchivePack } = useMutation({
    mutationFn: archiveProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] })
      toast.success("Bundle archived successfully")
    },
    onError: (error) => {
      toast.error("Failed to archive bundle")
      console.error(error)
    },
  })

  const onPackSubmit = (data: PackFormData) => {
    if (editingPack) {
      handleUpdatePack({ id: editingPack.id, data })
    } else {
      handleCreatePack(data)
    }
  }

  const handleEditPack = (pack: StripeProduct) => {
    setEditingPack(pack)
  }

  const onCancelEdit = () => {
    setEditingPack(null)
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
        <h1 className="text-3xl font-bold tracking-tight">Bundle Management</h1>
        <p className="text-muted-foreground">Create and manage product bundles with discounts</p>
      </div>

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
        <BundleOnlyList
          products={products || []}
          onEdit={handleEditPack}
          onArchive={handleArchivePack}
          isLoading={creatingPack || updatingPack}
          title="Bundle Management"
          description="Create and manage product bundles with discounts"
        />
      </div>
    </div>
  )
}
