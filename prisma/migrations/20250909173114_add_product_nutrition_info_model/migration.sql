-- CreateTable
CREATE TABLE "public"."ProductNutrition" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "nutrition" TEXT NOT NULL,

    CONSTRAINT "ProductNutrition_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProductNutrition_productId_key" ON "public"."ProductNutrition"("productId");
