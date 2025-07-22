"use client"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { StripeProduct } from "@/types/product"
import { Edit, Archive, Package } from "lucide-react"

interface ProductListProps {
  products: StripeProduct[]
  onEdit: (product: StripeProduct) => void
  onArchive: (id: string) => void
  isLoading?: boolean
}

export function ProductList({ products, onEdit, onArchive, isLoading }: ProductListProps) {
  const [archivingId, setArchivingId] = useState<string | null>(null)

  const handleArchive = async (id: string) => {
    setArchivingId(id)
    await onArchive(id)
    setArchivingId(null)
  }

  const formatPrice = (amount: number, currency: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(amount / 100)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Products ({products.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {products.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No products found</p>
        ) : (
          <div className="space-y-3">
            {products.map((product) => (
              <div
                key={product.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium truncate">{product.name}</h3>
                    {product.metadata?.type === "bundle" && <Badge variant="secondary">Bundle</Badge>}
                  </div>
                  {product.description && (
                    <p className="text-sm text-muted-foreground truncate">{product.description}</p>
                  )}
                  {product.default_price && (
                    <p className="text-sm font-medium">
                      {formatPrice(product.default_price.unit_amount, product.default_price.currency)}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <Button variant="outline" size="sm" onClick={() => onEdit(product)} disabled={isLoading}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleArchive(product.id)}
                    disabled={archivingId === product.id || isLoading}
                  >
                    <Archive className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
