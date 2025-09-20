/*
  Warnings:

  - Made the column `slug` on table `Blog` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Blog" ALTER COLUMN "slug" SET NOT NULL;
