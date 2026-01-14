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
import Link from "next/link"

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

  console.log(product)

  const handleAddToCart = () => {
    // Add to cart store
    // Determine if this is a multi-pack bundle
    const hasMultiplePacks = product.packOptions.length > 1;

    addOrUpdateItem({
      id: product.id,
      name: hasMultiplePacks ? `${product.name} (${selectedPack} Pack)` : product.name,
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

  // Check if this bundle has multiple pack options
  const hasMultiplePacks = product.packOptions.length > 1

  return (
    <div className={`bg-card border border-border rounded-2xl p-4 shadow-sm ${className}`}>
      <ProductHeader name={product.name} description={product.description} />

      {hasMultiplePacks ? (
        <div className="flex flex-row gap-2 items-center justify-between">
          <ProductImage src={currentImage} alt={product.imageAlt} savings={savings} className="w-full mb-0" />

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

            {/* <PurchaseOption
              type="onetime"
              title="One-time"
              price={product.pricing.onetime[selectedPack].price}
              isSelected={purchaseType === "onetime"}
              isRecommended
              onClick={() => setPurchaseType("onetime")}
            /> */}
          </div>
        </div>
      ) : (
        <div className="w-full mb-4">
          <Link href={`/pack/${product.slug}`}>
            <ProductImage src={currentImage} alt={product.imageAlt} savings={savings} className="w-full mb-0" />
          </Link>
        </div>
      )}

      {hasMultiplePacks && (
        <PackSelector options={product.packOptions} selected={selectedPack} onSelect={setSelectedPack} />
      )}

      {/* <PriceSummary total={currentPrice.total} original={currentPrice.original} /> */}

      <Button className="w-full h-12 text-base font-medium bg-[#063354] hover:bg-[#063354]/90 dark:bg-white dark:hover:bg-white/90" size="lg" onClick={handleAddToCart}>
        Add to Cart - ${currentPrice.total.toFixed(2)}
      </Button>

      {/* <TrustIndicators indicators={product.trustIndicators} /> */}
    </div>
  )
}
