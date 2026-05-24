-- CreateEnum
CREATE TYPE "ReviewRequestStatus" AS ENUM ('PENDING', 'COMPLETED', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('PUBLISHED', 'HIDDEN');

-- AlterTable
ALTER TABLE "shop_profiles" ADD COLUMN     "activityScore" DECIMAL(10,4),
ADD COLUMN     "consultationCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "pageViewCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "rankScore" DECIMAL(10,4),
ADD COLUMN     "reviewCount" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "status" SET DEFAULT 'offline';

-- CreateTable
CREATE TABLE "shop_review_requests" (
    "id" TEXT NOT NULL,
    "shopUserId" TEXT NOT NULL,
    "bossUserId" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "status" "ReviewRequestStatus" NOT NULL DEFAULT 'PENDING',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shop_review_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shop_reviews" (
    "id" TEXT NOT NULL,
    "shopUserId" TEXT NOT NULL,
    "bossUserId" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "content" VARCHAR(500) NOT NULL,
    "isAnonymous" BOOLEAN NOT NULL DEFAULT false,
    "status" "ReviewStatus" NOT NULL DEFAULT 'PUBLISHED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shop_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shop_page_views" (
    "id" TEXT NOT NULL,
    "shopUserId" TEXT NOT NULL,
    "visitorId" TEXT,
    "source" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shop_page_views_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shop_consultations" (
    "id" TEXT NOT NULL,
    "shopUserId" TEXT NOT NULL,
    "bossUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shop_consultations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "shop_review_requests_shopUserId_bossUserId_createdAt_idx" ON "shop_review_requests"("shopUserId", "bossUserId", "createdAt");

-- CreateIndex
CREATE INDEX "shop_review_requests_bossUserId_status_idx" ON "shop_review_requests"("bossUserId", "status");

-- CreateIndex
CREATE INDEX "shop_review_requests_shopUserId_status_idx" ON "shop_review_requests"("shopUserId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "shop_reviews_requestId_key" ON "shop_reviews"("requestId");

-- CreateIndex
CREATE INDEX "shop_reviews_shopUserId_bossUserId_createdAt_idx" ON "shop_reviews"("shopUserId", "bossUserId", "createdAt");

-- CreateIndex
CREATE INDEX "shop_reviews_shopUserId_status_createdAt_idx" ON "shop_reviews"("shopUserId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "shop_page_views_shopUserId_createdAt_idx" ON "shop_page_views"("shopUserId", "createdAt");

-- CreateIndex
CREATE INDEX "shop_consultations_shopUserId_createdAt_idx" ON "shop_consultations"("shopUserId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "shop_consultations_shopUserId_bossUserId_key" ON "shop_consultations"("shopUserId", "bossUserId");

-- AddForeignKey
ALTER TABLE "shop_reviews" ADD CONSTRAINT "shop_reviews_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "shop_review_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;
