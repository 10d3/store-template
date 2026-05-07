-- AlterTable
ALTER TABLE "order" ADD COLUMN     "customerEmail" TEXT,
ADD COLUMN     "customerName" TEXT,
ALTER COLUMN "userId" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "order_customerEmail_idx" ON "order"("customerEmail");
