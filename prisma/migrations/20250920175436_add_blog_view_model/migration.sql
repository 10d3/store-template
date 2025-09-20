-- AlterTable
ALTER TABLE "Blog" ADD COLUMN     "published" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "BlogView" (
    "id" TEXT NOT NULL,
    "blogId" TEXT NOT NULL,
    "viewerIdentifier" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BlogView_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BlogView_blogId_viewerIdentifier_key" ON "BlogView"("blogId", "viewerIdentifier");

-- AddForeignKey
ALTER TABLE "BlogView" ADD CONSTRAINT "BlogView_blogId_fkey" FOREIGN KEY ("blogId") REFERENCES "Blog"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
