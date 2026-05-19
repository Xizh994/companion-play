# 搭子星 · 运行环境说明

## 环境对照表

| 项目 | 生产 | 测试 |
|------|------|------|
| 域名 | [www.dazistar.com](http://www.dazistar.com) | [test.dazistar.com](http://test.dazistar.com) |
| 端口 | **3000** | **3001** |
| PM2 进程 | `dazistar` | `dazistar-3001` |
| 代码目录 | `/www/dazistar` | `/www/dazistar-test` |
| 部署脚本 | `bash scripts/deploy-prod.sh` | `bash scripts/deploy-test.sh` |
| Nginx 配置 | `www.dazistar.conf` | `test.dazistar.conf` |

本地开发：`npm run dev`，默认 `http://localhost:3000`（`PORT` 见 `server.js`）。

## 地址相关：代码里要不要改？

| 能力 | 实现方式 | 测试环境是否要单独配 |
|------|----------|----------------------|
| HTTP API | 前端 `fetch("/api/...")` 相对路径 | **否**，自动走当前域名 |
| Socket.IO | `io(window.location.origin)` | **否**，访问 test 即连 test |
| 登录 Cookie / localStorage | 按域名隔离 | **否**，test 与 www 互不串号 |
| `NEXT_PUBLIC_APP_URL` | 构建时写入（当前业务代码几乎未引用） | **建议在各自目录 `.env` 写对**，见 `env/*.env.example` |
| `NEXTAUTH_URL` | 服务端 / 未来 OAuth 回调 | **是**，测试填 `http://test.dazistar.com` |
| `DATABASE_URL` | 服务端 Prisma | **强烈建议分库**，避免测试污染生产 |
| Nginx | 反代到对应端口 | **是**，test → 3001，www → 3000 |

结论：**业务代码无需为 test.dazistar.com 写死域名**；需要在服务器上分开的是 **`.env`、构建目录、Nginx、PM2**。

## 部署脚本

```bash
bash scripts/deploy-prod.sh   # 仅生产：/www/dazistar + 3000
bash scripts/deploy-test.sh   # 仅测试：/www/dazistar-test + 3001
bash scripts/deploy.sh        # 仅在两目录同源且 .env 策略一致时使用；见下节
```

配置文件：`ecosystem.config.js`（已按环境写入 `NEXTAUTH_URL` / `NEXT_PUBLIC_APP_URL` / `PORT`）。

### ⚠️ `deploy.sh` 与测试目录

`deploy.sh` 只在 **`/www/dazistar`** 执行一次 `next build`，然后 reload 两个 PM2 进程。  
测试实例的工作目录是 **`/www/dazistar-test`**，应使用 **`deploy-test.sh`** 在该目录单独构建，否则测试环境可能跑到旧构建产物。

推荐日常流程：

- 只改测试 → `deploy-test.sh`
- 只发生产 → `deploy-prod.sh`
- 不要依赖 `deploy.sh` 同时更新两个环境的构建产物

## 服务器 `.env` 检查清单

**测试**（`/www/dazistar-test/.env`，模板见 `env/test.env.example`）：

```env
PORT=3001
NEXT_PUBLIC_APP_URL=http://test.dazistar.com
NEXTAUTH_URL=http://test.dazistar.com
DATABASE_URL=.../dazistar_test   # 建议独立库名
```

**生产**（`/www/dazistar/.env`，模板见 `env/prod.env.example`）：

```env
PORT=3000
NEXT_PUBLIC_APP_URL=http://www.dazistar.com
NEXTAUTH_URL=http://www.dazistar.com
DATABASE_URL=.../dazistar
```

修改 `NEXT_PUBLIC_*` 后必须在**对应目录**重新 `npm run build` 才会打进前端包。

## Nginx 与 Socket.IO（必读）

应用必须通过 **`node server.js`**（PM2 的 `script: server.js`）启动，不能用单独的 `next start`。

反向代理**不能**使用 `proxy_set_header Connection "";`，否则会出现 `websocket error` 与「重新连接中…」。

| 环境 | 仓库配置 | 反代目标 |
|------|----------|----------|
| 测试 | `test.dazistar.conf` | `http://[::1]:3001` |
| 生产 | `www.dazistar.conf` | `http://[::1]:3000` |

```bash
sudo cp test.dazistar.conf /etc/nginx/sites-available/   # 或 sites-enabled
sudo nginx -t && sudo systemctl reload nginx
```

`location /` 需配置 `Upgrade` 与 `Connection $connection_upgrade`（见 conf 内 `map` 块）。

## 认证功能策略

- **测试（3001）**：实名、店铺验真先在此验证；可用 `ID_VERIFY_MOCK`。
- **生产（3000）**：测试通过后再部署；生产关闭 MOCK。

详见 [verification-v1.md](./design/verification-v1.md)。
