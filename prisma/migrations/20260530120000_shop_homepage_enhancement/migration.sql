-- AlterTable
ALTER TABLE "shop_profiles" ADD COLUMN "shopCoverStatus" "VerificationStatus" NOT NULL DEFAULT 'APPROVED';
ALTER TABLE "shop_profiles" ADD COLUMN "shopBannerStatus" "VerificationStatus" NOT NULL DEFAULT 'APPROVED';
ALTER TABLE "shop_profiles" ADD COLUMN "slogan" TEXT;
ALTER TABLE "shop_profiles" ADD COLUMN "priceFrom" DECIMAL(10,2);
ALTER TABLE "shop_profiles" ADD COLUMN "priceUnit" TEXT NOT NULL DEFAULT 'hour';
ALTER TABLE "shop_profiles" ADD COLUMN "priceNote" TEXT;
ALTER TABLE "shop_profiles" ADD COLUMN "themeKey" TEXT NOT NULL DEFAULT 'violet';
ALTER TABLE "shop_profiles" ADD COLUMN "showPromoImages" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "shop_profiles" ADD COLUMN "showShowcasePlayers" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "shop_profiles" ADD COLUMN "showReviews" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "shop_promo_images" (
    "id" TEXT NOT NULL,
    "shopProfileId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "status" "VerificationStatus" NOT NULL DEFAULT 'APPROVED',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shop_promo_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shop_showcase_players" (
    "id" TEXT NOT NULL,
    "shopProfileId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "avatar" TEXT,
    "gameTags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "pricePerHour" DECIMAL(10,2),
    "highlight" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isFeatured" BOOLEAN NOT NULL DEFAULT true,
    "isOnline" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shop_showcase_players_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shop_favorites" (
    "id" TEXT NOT NULL,
    "shopUserId" TEXT NOT NULL,
    "bossUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shop_favorites_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "shop_promo_images_shopProfileId_sortOrder_idx" ON "shop_promo_images"("shopProfileId", "sortOrder");

-- CreateIndex
CREATE INDEX "shop_showcase_players_shopProfileId_sortOrder_idx" ON "shop_showcase_players"("shopProfileId", "sortOrder");

-- CreateIndex
CREATE INDEX "shop_favorites_bossUserId_idx" ON "shop_favorites"("bossUserId");

-- CreateIndex
CREATE UNIQUE INDEX "shop_favorites_shopUserId_bossUserId_key" ON "shop_favorites"("shopUserId", "bossUserId");

-- AddForeignKey
ALTER TABLE "shop_promo_images" ADD CONSTRAINT "shop_promo_images_shopProfileId_fkey" FOREIGN KEY ("shopProfileId") REFERENCES "shop_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shop_showcase_players" ADD CONSTRAINT "shop_showcase_players_shopProfileId_fkey" FOREIGN KEY ("shopProfileId") REFERENCES "shop_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
