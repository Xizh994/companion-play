#!/bin/bash
# 将「已在库中落地」的 migration 标记为已应用，再 deploy 剩余 migration。
# 用法: bash scripts/prisma-migrate-baseline.sh 20260524092950_shop_review_system
set -euo pipefail

cd "$(dirname "$0")/.."

LAST_APPLIED="${1:-}"
if [ -z "$LAST_APPLIED" ]; then
  echo "用法: bash scripts/prisma-migrate-baseline.sh <migration_dir_name>"
  echo ""
  echo "将按时间顺序把该目录及之前的 migration 全部 mark 为 applied，"
  echo "然后执行 migrate deploy 应用之后的 migration。"
  echo ""
  echo "请先确认数据库结构确实已包含这些 migration 的变更（例如曾 db push）。"
  exit 1
fi

found=0
for dir in prisma/migrations/*/; do
  name=$(basename "$dir")
  case "$name" in migration_lock.toml) continue ;; esac

  echo "[INFO] resolve --applied $name"
  npx prisma migrate resolve --applied "$name"

  if [ "$name" = "$LAST_APPLIED" ]; then
    found=1
    break
  fi
done

if [ "$found" -ne 1 ]; then
  echo "[ERR] 未找到 migration: $LAST_APPLIED"
  exit 1
fi

echo "[INFO] baseline 完成，执行 migrate deploy ..."
npx prisma migrate deploy
echo "[ OK ] 完成"
