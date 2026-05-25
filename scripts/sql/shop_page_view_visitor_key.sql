-- 手工补 visitorKey（与 migration 20260525061748 逻辑一致，可重复执行）

ALTER TABLE "shop_page_views" ADD COLUMN IF NOT EXISTS "visitorKey" TEXT;

UPDATE "shop_page_views"
SET "visitorKey" = COALESCE("visitorId", 'legacy:' || "id")
WHERE "visitorKey" IS NULL;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'shop_page_views'
      AND column_name = 'visitorKey'
      AND is_nullable = 'YES'
  ) THEN
    ALTER TABLE "shop_page_views" ALTER COLUMN "visitorKey" SET NOT NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "shop_page_views_shopUserId_visitorKey_createdAt_idx"
ON "shop_page_views"("shopUserId", "visitorKey", "createdAt");
