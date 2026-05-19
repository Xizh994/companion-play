# 搭子星 · 运行环境说明

## 端口与部署

| 端口 | 环境 | PM2 进程名 | 域名（服务器） | 说明 |
|------|------|------------|----------------|------|
| **3000** | **生产** | `dazistar` / `dazistar-3000` | www.dazistar.com | 功能验收完成后再发布 |
| **3001** | **测试** | `dazistar-3001` | test.dazistar.com | 日常开发联调、认证功能先在此验证 |

本地开发默认端口由 `PORT` 环境变量决定（见 `server.js`），一般为 `3000`。

## 部署脚本

```bash
bash scripts/deploy-prod.sh   # 仅生产 3000
bash scripts/deploy-test.sh   # 仅测试 3001
bash scripts/deploy.sh        # 两者
```

配置文件：`ecosystem.config.js`、`ecosystem.fork.js`。

## 环境变量

- 生产、测试可共用同一份 `.env` 结构，通过 `PORT` 与 PM2 实例区分。
- 认证相关开关见 `.env.example` 中「阿里云实人 / 店铺验真」一节。
- 详细认证流程与前端状态见 [verification-v1.md](./design/verification-v1.md)。

## 测试 vs 生产策略（认证功能）

- **测试环境（3001）**：在测试环境把实名、店铺验真链路跑通；可使用 `ID_VERIFY_MOCK` 或真实阿里云 API，UI 状态与生产一致。
- **生产环境（3000）**：认证相关功能在测试环境验收后再部署；**不需要**对用户展示「平台企业验真服务开通中」类过渡文案。
