"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import type { ProductData, PurchaseType } from "@/types/product"
import { ProductHeader } from "./product-header"
import { ProductImage } from "./product-image"
import { PurchaseOption } from "./purchase-option"
import { PackSelector } from "./pack-selector"
// import { PriceSummary } from "./price-summary"
// import { TrustIndicators } from "./trust-indicators"
import { useCartStore } from "@/lib/store"

interface PackCardProps {
  product: ProductData
  defaultPack?: string
  defaultPurchaseType?: PurchaseType
  onAddToCart?: (data: {
    productId: string
    pack: string
    purchaseType: PurchaseType
    price: number
    total: number
  }) => void
  className?: string
}

export function PackCardNew({
  product,
  defaultPack,
  defaultPurchaseType = "subscribe",
  onAddToCart,
  className = "",
}: PackCardProps) {
  const [selectedPack, setSelectedPack] = useState(
    defaultPack || product.packOptions[product.packOptions.length - 1].value,
  )
  const [purchaseType, setPurchaseType] = useState<PurchaseType>(defaultPurchaseType)
  const { addOrUpdateItem } = useCartStore()

  const currentPrice = product.pricing[purchaseType][selectedPack]
  const savings = Math.round(((currentPrice.original - currentPrice.total) / currentPrice.original) * 100)

  const handleAddToCart = () => {
    // Add to cart store
    addOrUpdateItem({
      id: product.id,
      name: `${product.name} (${selectedPack} Pack)`,
      image: product.image,
      price: Math.round(currentPrice.total * 100), // Convert to cents
      quantity: 1, // 1 pack
      maxQuantity: 99,
      metadata: {
        packSize: parseInt(selectedPack),
        purchaseType,
        pricePerUnit: currentPrice.price,
      },
    })

    // Also call optional callback
    if (onAddToCart) {
      onAddToCart({
        productId: product.id,
        pack: selectedPack,
        purchaseType,
        price: currentPrice.price,
        total: currentPrice.total,
      })
    }
  }

  // Get image for current pack size, fallback to default image
  const currentImage = product.images?.[selectedPack] || product.image

  return (
    <div className={`bg-card border border-border rounded-2xl p-4 shadow-sm ${className}`}>
      <ProductHeader name={product.name} description={product.description} />

      <div className="flex flex-row gap-2 items-center justify-between">
        <ProductImage src={currentImage} alt={product.imageAlt} savings={savings} />

        <div className="space-y-3 mb-0 flex-1 items-center flex ">
          {/* <PurchaseOption
            type="subscribe"
            title="Subscribe & Save"
            price={product.pricing.subscribe[selectedPack].price}
            // description="Cancel anytime • 10% off every order"
            isRecommended
            isSelected={purchaseType === "subscribe"}
            onClick={() => setPurchaseType("subscribe")}
          /> */}

          <PurchaseOption
            type="onetime"
            title="One-time"
            price={product.pricing.onetime[selectedPack].price}
            isSelected={purchaseType === "onetime"}
            isRecommended
            onClick={() => setPurchaseType("onetime")}
          />
        </div>
      </div>

      <PackSelector options={product.packOptions} selected={selectedPack} onSelect={setSelectedPack} />

      {/* <PriceSummary total={currentPrice.total} original={currentPrice.original} /> */}

      <Button className="w-full h-12 text-base font-medium" size="lg" onClick={handleAddToCart}>
        Add to Cart - ${currentPrice.total.toFixed(2)}
      </Button>

      {/* <TrustIndicators indicators={product.trustIndicators} /> */}
    </div>
  )
}
