"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import type { ProductWithVariants } from "@/lib/catalog"
import { ProductHeader } from "./product-header"
import { ProductImage } from "./product-image"
import { PurchaseOption } from "./purchase-option"
import { PackSelector } from "./pack-selector"
// import { PriceSummary } from "./price-summary"
// import { TrustIndicators } from "./trust-indicators"
import { useCartStore } from "@/lib/store"
import Link from "next/link"

type PurchaseType = "subscribe" | "onetime"

interface PackCardProps {
  product: ProductWithVariants
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
  // Variants are the source of truth for purchasable options (price in cents).
  const packOptions = product.variants.map((variant) => ({
    value: variant.id,
    label: variant.title,
  }))

  const [selectedPack, setSelectedPack] = useState(
    defaultPack || packOptions[packOptions.length - 1]?.value || "",
  )
  const [purchaseType, setPurchaseType] = useState<PurchaseType>(defaultPurchaseType)
  const { addOrUpdateItem } = useCartStore()

  const currentVariant =
    product.variants.find((variant) => variant.id === selectedPack) ??
    product.defaultVariant ??
    product.variants[0] ??
    null

  const priceCents = currentVariant?.price ?? 0
  const compareAtCents = currentVariant?.compareAtPrice ?? priceCents
  const currentPrice = {
    price: priceCents / 100,
    total: priceCents / 100,
    original: compareAtCents / 100,
  }
  const savings =
    currentPrice.original > 0
      ? Math.round(((currentPrice.original - currentPrice.total) / currentPrice.original) * 100)
      : 0

  const currentImage = currentVariant?.image || product.images?.[0] || ""
  const hasMultiplePacks = product.variants.length > 1

  const handleAddToCart = () => {
    // Never fabricate a variant id: bail out if no real variant is available.
    if (!currentVariant) {
      console.error("PackCardNew: no variant available to add to cart", product.id)
      return
    }

    addOrUpdateItem({
      id: product.id,
      name: hasMultiplePacks ? `${product.name} (${currentVariant.title})` : product.name,
      image: currentImage, // Use variant-specific image
      price: Math.round(currentPrice.total * 100), // Convert to cents
      quantity: 1, // 1 pack
      maxQuantity: 99,
      variantId: currentVariant.id, // Real ProductVariant id
      metadata: {
        packSize: currentVariant.position,
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

  return (
    <div className={`bg-card border border-border rounded-2xl p-4 shadow-sm ${className}`}>
      <ProductHeader name={product.name} description={product.description ?? ""} />

      {hasMultiplePacks ? (
        <div className="flex flex-row gap-2 items-center justify-between">
          <ProductImage src={currentImage} alt={product.name} savings={savings} className="w-full mb-0" />

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
          <Link href={`/pack/${product.slug ?? ""}`}>
            <ProductImage src={currentImage} alt={product.name} savings={savings} className="w-full mb-0" />
          </Link>
        </div>
      )}

      {hasMultiplePacks && (
        <PackSelector options={packOptions} selected={selectedPack} onSelect={setSelectedPack} />
      )}

      {/* <PriceSummary total={currentPrice.total} original={currentPrice.original} /> */}

      <Button className="w-full h-12 text-base font-medium bg-[#063354] hover:bg-[#063354]/90 dark:bg-white dark:hover:bg-white/90" size="lg" onClick={handleAddToCart}>
        Add to Cart - ${currentPrice.total.toFixed(2)}
      </Button>

      {/* <TrustIndicators indicators={product.trustIndicators} /> */}
    </div>
  )
}
