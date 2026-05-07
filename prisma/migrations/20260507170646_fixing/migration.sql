-- AlterTable
ALTER TABLE "order" ALTER COLUMN "orderNumber" DROP DEFAULT,
ALTER COLUMN "orderNumber" SET DATA TYPE TEXT;
DROP SEQUENCE "order_orderNumber_seq";

-- AlterTable
ALTER TABLE "prices" ADD COLUMN     "image" TEXT,
ADD COLUMN     "metadata" JSONB;
