# 数据库迁移（Prisma）

## 部署时怎么做

测试/生产发布脚本（`scripts/deploy-test.sh` 等）只会执行：

```bash
bash scripts/prisma-migrate-deploy.sh
```

**不会**再回退到 `prisma db push`，避免在表有数据时提示 **reset 整库**。

## 测试库首次对齐（曾用 db push、出现 P3005）

1. 确认库结构已包含评价系统等变更，**只差** `visitorKey` 等新 migration。
2. 在服务器项目目录执行（把目录名换成你库中已落地的最后一条）：

```bash
cd /www/dazistar-test   # 或生产目录
bash scripts/prisma-migrate-baseline.sh 20260524092950_shop_review_system
```

3. 成功后重新跑 `bash scripts/deploy-test.sh`。

若 baseline 不方便，可只补列再标记 migration：

```bash
psql "$DATABASE_URL" -f scripts/sql/shop_page_view_visitor_key.sql
npx prisma migrate resolve --applied 20260525061748_shop_page_view_dedupe
```

## 本地改过已应用的 migration SQL

```bash
bash scripts/prisma-sync-migration-checksum.sh 20260525061748_shop_page_view_dedupe
npx prisma migrate deploy
```

## 禁止在生产/测试库使用

- `prisma db push`（尤其带 `--accept-data-loss`）
- `prisma migrate reset`
- 交互式选择 **y** 清空数据库

## visitorKey 迁移说明

`20260525061748_shop_page_view_dedupe` 采用：加可空列 → 用 `visitorId` 或 `legacy:{id}` 回填 → 再设 NOT NULL，兼容 `shop_page_views` 中已有行。
