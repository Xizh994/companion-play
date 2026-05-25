#!/bin/bash
# 仅使用 migrate deploy，禁止 db push / reset。供部署脚本与手工执行。
set -euo pipefail

cd "$(dirname "$0")/.."

if [ ! -f .env ] && [ -z "${DATABASE_URL:-}" ]; then
  echo "[ERR] 未找到 .env 且未设置 DATABASE_URL"
  exit 1
fi

echo "[INFO] prisma migrate deploy ..."
if npx prisma migrate deploy; then
  echo "[ OK ] 数据库迁移完成"
  exit 0
fi

code=$?
echo ""
echo "[ERR] prisma migrate deploy 失败 (exit $code)"
echo ""
echo "常见原因与处理（切勿使用 prisma db push / migrate reset，会威胁整库数据）："
echo ""
echo "1) P3005 — 库已有表但 _prisma_migrations 未对齐（曾用 db push 建库）"
echo "   在确认当前库结构已包含「除待发布 migration 外」的全部变更后，执行："
echo "   bash scripts/prisma-migrate-baseline.sh <已落地的最后一个 migration 目录名>"
echo "   例: bash scripts/prisma-migrate-baseline.sh 20260524092950_shop_review_system"
echo ""
echo "2) 某条 migration 已应用但本地改过 SQL（checksum 不一致）"
echo "   bash scripts/prisma-sync-migration-checksum.sh 20260525061748_shop_page_view_dedupe"
echo ""
echo "3) 仅需补 visitorKey 列（紧急）"
echo "   在库上执行: psql \$DATABASE_URL -f scripts/sql/shop_page_view_visitor_key.sql"
echo "   再: npx prisma migrate resolve --applied 20260525061748_shop_page_view_dedupe"
echo ""
exit "$code"
