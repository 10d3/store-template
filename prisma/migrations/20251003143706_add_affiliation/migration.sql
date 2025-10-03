/*
  Warnings:

  - Added the required column `productId` to the `referrals` table without a default value. This is not possible if the table is not empty.
  - Added the required column `productName` to the `referrals` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "referrals" ADD COLUMN     "productId" TEXT NOT NULL,
ADD COLUMN     "productName" TEXT NOT NULL,
ADD COLUMN     "quantity" INTEGER NOT NULL DEFAULT 1;
