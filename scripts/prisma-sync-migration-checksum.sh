#!/bin/bash
# 本地已 apply 的 migration 若改过 SQL，用此脚本更新 _prisma_migrations.checksum
# 用法: bash scripts/prisma-sync-migration-checksum.sh 20260525061748_shop_page_view_dedupe
set -euo pipefail

cd "$(dirname "$0")/.."

MIGRATION_NAME="${1:-}"
if [ -z "$MIGRATION_NAME" ]; then
  echo "用法: bash scripts/prisma-sync-migration-checksum.sh <migration_dir_name>"
  exit 1
fi

SQL_FILE="prisma/migrations/${MIGRATION_NAME}/migration.sql"
if [ ! -f "$SQL_FILE" ]; then
  echo "[ERR] 不存在: $SQL_FILE"
  exit 1
fi

node -e "
const crypto = require('crypto');
const fs = require('fs');
const name = process.argv[1];
const sql = fs.readFileSync('prisma/migrations/' + name + '/migration.sql');
const checksum = crypto.createHash('sha256').update(sql).digest('hex');
console.log(checksum);
" "$MIGRATION_NAME" > /tmp/prisma_checksum.txt

CHECKSUM=$(cat /tmp/prisma_checksum.txt)
echo "[INFO] 新 checksum: $CHECKSUM"

npx prisma db execute --stdin <<EOF
UPDATE "_prisma_migrations"
SET "checksum" = '${CHECKSUM}'
WHERE "migration_name" = '${MIGRATION_NAME}';
EOF

echo "[ OK ] 已更新 $MIGRATION_NAME 的 checksum，可再执行 migrate deploy"
