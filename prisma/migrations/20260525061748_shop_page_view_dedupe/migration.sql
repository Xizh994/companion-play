/*
  Warnings:

  - Added the required column `visitorKey` to the `shop_page_views` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "shop_page_views" ADD COLUMN     "visitorKey" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "shop_page_views_shopUserId_visitorKey_createdAt_idx" ON "shop_page_views"("shopUserId", "visitorKey", "createdAt");
