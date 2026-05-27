-- CreateTable
CREATE TABLE IF NOT EXISTS "app_kv" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "app_kv_pkey" PRIMARY KEY ("key")
);
