-- AlterTable
ALTER TABLE "shop_profiles" ADD COLUMN "gameCategories" TEXT[] DEFAULT ARRAY[]::TEXT[];
