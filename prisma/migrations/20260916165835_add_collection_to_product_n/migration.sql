-- AlterTable
ALTER TABLE "products" ADD COLUMN     "cjProductId" TEXT,
ADD COLUMN     "collection" TEXT,
ADD COLUMN     "collectionOrder" INTEGER,
ADD COLUMN     "featured" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "source" TEXT NOT NULL DEFAULT 'MANUAL',
ADD COLUMN     "tags" TEXT[],
ADD COLUMN     "trackInventory" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "product_variants" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "stripePriceId" TEXT,
    "sku" TEXT,
    "options" JSONB NOT NULL DEFAULT '{}',
    "cjVariantId" TEXT,
    "cjSku" TEXT,
    "cost" INTEGER,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "image" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_variants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fulfillments" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "cjOrderId" TEXT,
    "cjOrderNum" TEXT,
    "status" TEXT NOT NULL,
    "trackingNumber" TEXT,
    "trackingUrl" TEXT,
    "carrier" TEXT,
    "raw" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fulfillments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cj_auth" (
    "id" TEXT NOT NULL DEFAULT 'cj',
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "accessExpiresAt" TIMESTAMP(3) NOT NULL,
    "refreshExpiresAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cj_auth_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "product_variants_stripePriceId_key" ON "product_variants"("stripePriceId");

-- CreateIndex
CREATE INDEX "product_variants_productId_idx" ON "product_variants"("productId");

-- CreateIndex
CREATE INDEX "product_variants_cjVariantId_idx" ON "product_variants"("cjVariantId");

-- CreateIndex
CREATE INDEX "product_variants_productId_active_idx" ON "product_variants"("productId", "active");

-- CreateIndex
CREATE INDEX "fulfillments_orderId_idx" ON "fulfillments"("orderId");

-- CreateIndex
CREATE INDEX "fulfillments_provider_status_idx" ON "fulfillments"("provider", "status");

-- CreateIndex
CREATE INDEX "fulfillments_cjOrderId_idx" ON "fulfillments"("cjOrderId");

-- CreateIndex
CREATE INDEX "products_source_idx" ON "products"("source");

-- CreateIndex
CREATE INDEX "products_cjProductId_idx" ON "products"("cjProductId");

-- CreateIndex
CREATE INDEX "products_collection_idx" ON "products"("collection");

-- CreateIndex
CREATE INDEX "products_featured_idx" ON "products"("featured");

-- AddForeignKey
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fulfillments" ADD CONSTRAINT "fulfillments_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
