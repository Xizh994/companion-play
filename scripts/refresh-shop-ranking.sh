#!/bin/bash
# 手动刷新大厅热门榜（生产/测试 cron 可每日 0:05 上海时间调用）
set -euo pipefail
cd "$(dirname "$0")/.."
npx tsx scripts/refresh-shop-ranking.ts
