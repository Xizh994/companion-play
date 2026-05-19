# 搭子星 (DaziStar / Companion-Play) — Code Wiki

> 游戏搭子平台，汇聚优质陪玩师与店铺，让游戏不再孤单。
>
> 版本: `0.1.0` | 生成日期: 2026-05-06

---

## 目录

1. [项目概览](#1-项目概览)
2. [技术栈](#2-技术栈)
3. [项目架构](#3-项目架构)
4. [目录结构](#4-目录结构)
5. [数据库设计](#5-数据库设计)
6. [核心模块详解](#6-核心模块详解)
   - [6.1 认证模块 (auth)](#61-认证模块-auth)
   - [6.2 即时通讯模块 (chat / socket)](#62-即时通讯模块-chat--socket)
   - [6.3 用户服务模块 (users)](#63-用户服务模块-users)
   - [6.4 会话模块 (conversations)](#64-会话模块-conversations)
   - [6.5 页面路由模块](#65-页面路由模块)
   - [6.6 UI 组件模块](#66-ui-组件模块)
7. [关键类与函数说明](#7-关键类与函数说明)
8. [依赖关系图](#8-依赖关系图)
9. [项目运行方式](#9-项目运行方式)
10. [部署说明](#10-部署说明)

---

## 1. 项目概览

**搭子星** 是一个面向游戏玩家的陪玩服务平台，核心功能包括：

- **用户角色体系**：老板 (BOSS)、个人陪玩 (PLAYER)、陪玩店 (SHOP) 三种角色
- **发现与匹配**：浏览推荐陪玩师和店铺，按游戏品类筛选
- **即时聊天**：基于 Socket.IO 的实时一对一私聊
- **匹配大厅**：实时显示在线陪玩师，支持搜索
- **认证系统**：个人陪玩和店铺的实名/资质认证流程
- **个人中心**：订单记录、评价、账号设置

---

## 2. 技术栈

| 层级 | 技术 | 版本 |
|------|------|------|
| 框架 | Next.js (App Router) | 16.2.4 |
| UI 库 | React | 19.2.4 |
| 语言 | TypeScript | ^5 |
| ORM | Prisma | ^5.22.0 |
| 数据库 | PostgreSQL | - |
| 实时通信 | Socket.IO | ^4.8.3 |
| 样式 | Tailwind CSS | ^4 |
| 组件库 | shadcn/ui (base-nova) + Lucide React | - |
| 认证 | JWT (jsonwebtoken) + bcryptjs | - |
| 表单 | react-hook-form + zod | - |
| 状态管理 | Zustand | ^5.0.12 |
| 部署 | PM2 + Nginx | - |

---

## 3. 项目架构

```
┌──────────────────────────────────────────────────────┐
│                    浏览器 (Client)                     │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌─────────┐ │
│  │ Discover │ │  Lobby   │ │   Chat   │ │ Profile │ │
│  │ 发现页面  │ │ 匹配大厅  │ │ 即时聊天  │ │ 个人中心 │ │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬────┘ │
│       │            │            │            │        │
│  ┌────┴────────────┴────────────┴────────────┴────┐  │
│  │              Hooks Layer                        │  │
│  │   useAuth (认证)    useSocket (实时通信)         │  │
│  └────────────────────┬───────────────────────────┘  │
└───────────────────────┼──────────────────────────────┘
                        │
              HTTP / WebSocket
                        │
┌───────────────────────┼──────────────────────────────┐
│                  Next.js Server                       │
│  ┌────────────────────┴───────────────────────────┐  │
│  │              API Routes (REST)                  │  │
│  │  /api/auth/*   /api/users/*  /api/conversations/*│  │
│  └────────────────────┬───────────────────────────┘  │
│  ┌────────────────────┴───────────────────────────┐  │
│  │           Socket.IO Server (server.js)          │  │
│  │   在线管理 / 大厅广播 / 私聊消息转发              │  │
│  └────────────────────┬───────────────────────────┘  │
│  ┌────────────────────┴───────────────────────────┐  │
│  │              Lib Layer                          │  │
│  │  auth.ts (JWT+bcrypt)  prisma.ts  socket.ts    │  │
│  └────────────────────┬───────────────────────────┘  │
└───────────────────────┼──────────────────────────────┘
                        │
┌───────────────────────┼──────────────────────────────┐
│                 PostgreSQL 数据库                      │
│  users │ player_profiles │ shop_profiles │ messages  │
│  verifications │ conversations                         │
└──────────────────────────────────────────────────────┘
```

整体采用 **Next.js App Router** 的单体全栈架构：
- 前端通过 `use client` 组件调用 REST API 或 WebSocket
- 后端 API Routes 处理业务逻辑，通过 Prisma 操作 PostgreSQL
- Socket.IO 服务挂载在同一 HTTP Server 上，处理实时通信

---

## 4. 目录结构

```
companion-play/
├── prisma/
│   └── schema.prisma              # 数据库模型定义
├── public/                        # 静态资源 (SVG 图标等)
├── src/
│   ├── app/                       # Next.js App Router 页面 & API
│   │   ├── (app)/                 # 需认证的路由组 (带导航栏)
│   │   │   ├── layout.tsx         #    应用布局 (导航栏 + 登录/退出)
│   │   │   ├── page.tsx           #    /app → redirect /discover
│   │   │   ├── discover/
│   │   │   │   └── page.tsx       #    发现页 (推荐陪玩/店铺)
│   │   │   ├── lobby/
│   │   │   │   └── page.tsx       #    匹配大厅
│   │   │   ├── chat/
│   │   │   │   ├── page.tsx       #    聊天列表+聊天
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx   #    /chat/:id → redirect /chat
│   │   │   └── profile/
│   │   │       └── page.tsx       #    个人中心
│   │   ├── api/                   # API Routes
│   │   │   ├── auth/
│   │   │   │   ├── login/route.ts      # POST 登录
│   │   │   │   ├── register/route.ts   # POST 注册
│   │   │   │   └── me/route.ts         # GET  当前用户信息
│   │   │   ├── conversations/
│   │   │   │   ├── route.ts            # GET 列表 / POST 创建
│   │   │   │   └── [id]/messages/
│   │   │   │       └── route.ts        # GET/POST 消息
│   │   │   └── users/
│   │   │       └── route.ts            # GET 用户列表/详情
│   │   ├── login/page.tsx         # 登录页
│   │   ├── register/page.tsx      # 注册页
│   │   ├── profile/[id]/page.tsx  # 陪玩师公开资料页
│   │   ├── shop/[id]/page.tsx     # 陪玩店公开资料页
│   │   ├── layout.tsx             # 根布局 (metadata + 全局样式)
│   │   ├── globals.css            # 全局样式 (二次元主题)
│   │   └── page.tsx               # "/" → redirect /discover
│   ├── components/
│   │   ├── ui/                    # shadcn/ui 基础组件 (15个)
│   │   │   ├── avatar.tsx, badge.tsx, button.tsx, card.tsx
│   │   │   ├── checkbox.tsx, dialog.tsx, dropdown-menu.tsx
│   │   │   ├── input.tsx, label.tsx, scroll-area.tsx
│   │   │   ├── select.tsx, separator.tsx, sheet.tsx
│   │   │   ├── skeleton.tsx, sonner.tsx, tabs.tsx
│   │   └── GeneratedAvatar.tsx    # DiceBear 头像生成组件
│   ├── hooks/
│   │   ├── useAuth.ts             # 认证 Hook (登录/注册/登出)
│   │   └── useSocket.ts           # WebSocket 连接 Hook
│   └── lib/
│       ├── auth.ts                # JWT 签发/验证 + bcrypt 密码处理
│       ├── prisma.ts              # Prisma 客户端单例
│       ├── socket.ts              # Socket.IO 服务端逻辑
│       └── utils.ts               # cn() 工具函数 (clsx + tailwind-merge)
├── server.js                      # 自定义服务器入口 (Next.js + Socket.IO)
├── ecosystem.config.js            # PM2 多实例配置
├── deploy.sh                      # 一键部署脚本
├── package.json                   # 项目依赖与脚本
├── tsconfig.json                  # TypeScript 配置
├── next.config.ts                 # Next.js 配置
├── postcss.config.mjs             # PostCSS 配置 (Tailwind CSS v4)
├── components.json                # shadcn/ui 配置
└── eslint.config.mjs              # ESLint 配置
```

---

## 5. 数据库设计

### 5.1 ER 关系

```
┌──────────────────────┐
│        User          │  主表，所有角色共用
│──────────────────────│
│ id (PK, cuid)        │
│ phone (UNIQUE)       │── 手机号登录
│ passwordHash          │── bcrypt 加密
│ role (ENUM)           │── BOSS | PLAYER | SHOP
│ nickname, avatar, bio │
│ status                │── online/offline/busy
│ createdAt, updatedAt  │
└──────┬───────────────┘
       │ 1:1
       ├──────────────────────┐
       ▼                      ▼
┌──────────────┐    ┌──────────────┐
│PlayerProfile │    │ ShopProfile  │
│──────────────│    │──────────────│
│ userId (FK)  │    │ userId (FK)  │
│ realName     │    │ shopName     │
│ idCardNumber │    │ shopDesc     │
│ idCardFront  │    │ licenseType  │
│ idCardBack   │    │ licenseImage │
│ gameCategories│   │ contactName  │
│ pricePerHour │    │ contactPhone │
│ serviceTags  │    │ playerCount  │
│ serviceDesc  │    │ rating       │
│ verificationStatus│orderCount   │
└──────────────┘    └──────────────┘

┌──────────────┐         ┌──────────────────┐
│ Verification │         │   Conversation   │
│──────────────│         │──────────────────│
│ userId (FK)  │         │ id               │
│ applicantType│         │ participants[]   │
│ status       │         │ lastMessage      │
│ reviewer     │         │ lastMessageAt    │
└──────────────┘         └──────────────────┘
                               │
┌──────────────┐               │
│   Message    │               │
│──────────────│               │
│ fromId (FK)  │               │
│ toId (FK)    │               │
│ type         │               │
│ content      │               │
│ metadata(JSON)│              │
│ isRead       │               │
│ createdAt    │               │
└──────────────┘               │
  INDEX: [toId, isRead]        │
```

### 5.2 枚举类型

| 枚举名 | 值 | 说明 |
|--------|-----|------|
| `UserRole` | `BOSS`, `PLAYER`, `SHOP` | 用户角色 |
| `VerificationStatus` | `PENDING`, `APPROVED`, `REJECTED` | 认证审核状态 |

### 5.3 关键索引

- `User.phone` — UNIQUE，登录查询
- `Message` — 复合索引 `[toId, isRead]`，优化未读消息查询
- `PlayerProfile.userId` — UNIQUE，一对一关联
- `ShopProfile.userId` — UNIQUE，一对一关联
- `Verification.userId` — UNIQUE，一对一关联

---

## 6. 核心模块详解

### 6.1 认证模块 (auth)

**文件位置**:
- [src/lib/auth.ts](file:///c:/Users/62370/.qclaw/workspace/companion-play/src/lib/auth.ts) — JWT 工具函数
- [src/hooks/useAuth.ts](file:///c:/Users/62370/.qclaw/workspace/companion-play/src/hooks/useAuth.ts) — 客户端认证 Hook
- [src/app/api/auth/login/route.ts](file:///c:/Users/62370/.qclaw/workspace/companion-play/src/app/api/auth/login/route.ts) — 登录 API
- [src/app/api/auth/register/route.ts](file:///c:/Users/62370/.qclaw/workspace/companion-play/src/app/api/auth/register/route.ts) — 注册 API
- [src/app/api/auth/me/route.ts](file:///c:/Users/62370/.qclaw/workspace/companion-play/src/app/api/auth/me/route.ts) — 获取当前用户 API

#### 认证流程

```
注册: POST /api/auth/register
  1. 验证手机号 + 密码不为空
  2. 检查手机号是否已注册
  3. bcrypt 哈希密码 → 创建 User
  4. 根据角色创建 PlayerProfile 或 ShopProfile
  5. 签发 JWT Token (7天有效) → 返回 token + user

登录: POST /api/auth/login
  1. 验证手机号 + 密码
  2. 查询用户 → 比对密码哈希
  3. 更新用户状态为 "online"
  4. 签发 JWT → 返回 token + user

鉴权: 后续请求在 Authorization: Bearer <token> 头中携带
  → getTokenFromRequest() 提取 → verifyToken() 验证
```

#### 关键函数

| 函数 | 所在文件 | 说明 |
|------|---------|------|
| `hashPassword(password)` | auth.ts | bcrypt 哈希密码，salt rounds=10 |
| `comparePassword(password, hash)` | auth.ts | 验证密码 |
| `signToken({userId, role})` | auth.ts | 签发 JWT，有效期7天 |
| `verifyToken(token)` | auth.ts | 验证 JWT，返回 payload 或 null |
| `getTokenFromRequest(req)` | auth.ts | 从 Request Header 提取 Bearer Token |

### 6.2 即时通讯模块 (chat / socket)

**文件位置**:
- [server.js](file:///c:/Users/62370/.qclaw/workspace/companion-play/server.js) — Socket.IO 服务 (简易版)
- [src/lib/socket.ts](file:///c:/Users/62370/.qclaw/workspace/companion-play/src/lib/socket.ts) — Socket.IO 服务端逻辑 (增强版)
- [src/hooks/useSocket.ts](file:///c:/Users/62370/.qclaw/workspace/companion-play/src/hooks/useSocket.ts) — 客户端 Socket Hook

#### Socket 事件协议

```
客户端 → 服务器:
  "auth"           {userId}          用户身份注册
  "join_lobby"     -                 加入匹配大厅房间
  "leave_lobby"    -                 离开匹配大厅房间
  "join_chat"      {roomId}          加入私聊房间
  "private_message" {roomId, message} 发送私聊消息
  "lobby_message"  {data}            发送大厅广播消息

服务器 → 客户端:
  "new_message"    {message}         收到新私聊消息
  "lobby_users"    [{userId}]        大厅在线用户列表
  "lobby_broadcast" {data}          大厅广播消息
  "user_offline"   {userId}         某用户下线

系统:
  "connect"        -                 WebSocket 连接成功
  "disconnect"     -                 WebSocket 断开
```

#### 架构说明

项目中有两份 Socket.IO 实现：
1. **server.js** (`npm start` 使用) — 简易版，直接挂载在自定义 HTTP Server 上
2. [src/lib/socket.ts](file:///c:/Users/62370/.qclaw/workspace/companion-play/src/lib/socket.ts) — 增强版，提供 `initSocket()` / `getIO()` 导出，功能更完整

两个版本都维护一个 `onlineUsers: Map<userId, socketId>` 内存映射来追踪在线状态。

### 6.3 用户服务模块 (users)

**API**: `GET /api/users`

| 参数 | 类型 | 说明 |
|------|------|------|
| `id` | string | 查询单个用户（返回 PlayerProfile）|
| `role` | string | 按角色筛选 |
| `game` | string | 按游戏品类筛选 |

- 列表查询默认返回 `role=PLAYER` 且 `status!=offline` 的用户（最多 50 条）
- 单个查询返回完整信息（含游戏品类、服务标签、价格等）

### 6.4 会话模块 (conversations)

**API**: `/api/conversations`

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/conversations` | 获取当前用户的会话列表（按 updatedAt 降序）|
| POST | `/api/conversations` | 创建或查找与目标用户的会话 |
| GET | `/api/conversations/:id/messages` | 获取会话消息（最近100条）|
| POST | `/api/conversations/:id/messages` | 发送消息 |

- 会话参与者以排序后的 `[userId1, userId2]` 数组存储
- 创建会话时先查找是否已存在，避免重复
- 发送消息后自动更新会话的 `lastMessage` 和 `lastMessageAt`

### 6.5 页面路由模块

#### 路由结构

```
/                        → 重定向到 /discover
/login                   → 登录页 (公开)
/register                → 注册页 (公开)
/app                     → 重定向到 /discover
/discover                → 发现页 (推荐陪玩店 + 个人陪玩)
/lobby                   → 匹配大厅 (在线陪玩师 + 发起聊天)
/chat                    → 聊天列表 + 聊天面板 (左右分栏)
/chat/[id]               → 重定向到 /chat
/profile                 → 个人中心 (订单/评价/设置)
/profile/[id]            → 陪玩师公开资料页
/shop/[id]               → 陪玩店公开资料页
```

#### 路由组说明

- **`(app)` 路由组**: 包含导航栏布局 ([layout.tsx](file:///c:/Users/62370/.qclaw/workspace/companion-play/src/app/(app)/layout.tsx))，页面间通过 Tab 导航切换（发现/大厅/消息/我的）
- **根路由** (`/`, `/login`, `/register`, `/profile/[id]`, `/shop/[id]`): 无导航栏，独立布局

#### 页面数据状态

| 页面 | 数据来源 | 说明 |
|------|---------|------|
| Discover | Mock 数据 (`SHOPS[]`, `PLAYERS[]`) | 硬编码的推荐列表 |
| Lobby | `GET /api/users` + Socket | 从 API 加载在线用户 + 实时更新 |
| Chat | `GET /api/conversations` + Socket | 会话列表 + 消息历史 + 实时消息 |
| Profile | Mock 数据 + localStorage | 用户信息、订单、评价均为硬编码 |
| Profile/[id] | Mock 数据 (`MOCK_PROFILES`) | 陪玩师资料页为硬编码 |
| Shop/[id] | Mock 数据 (`MOCK_SHOPS`) | 店铺资料页为硬编码 |

### 6.6 UI 组件模块

#### shadcn/ui 组件清单 (15个)

位于 [src/components/ui/](file:///c:/Users/62370/.qclaw/workspace/companion-play/src/components/ui/)

| 组件 | 文件 | 用途 |
|------|------|------|
| Avatar | avatar.tsx | 头像展示（基于 @base-ui/react）|
| Badge | badge.tsx | 标签/徽章 |
| Button | button.tsx | 按钮（多 variant）|
| Card | card.tsx | 卡片容器 |
| Checkbox | checkbox.tsx | 复选框 |
| Dialog | dialog.tsx | 模态对话框 |
| DropdownMenu | dropdown-menu.tsx | 下拉菜单 |
| Input | input.tsx | 输入框 |
| Label | label.tsx | 表单标签 |
| ScrollArea | scroll-area.tsx | 自定义滚动区域 |
| Select | select.tsx | 下拉选择 |
| Separator | separator.tsx | 分割线 |
| Sheet | sheet.tsx | 侧边抽屉 |
| Skeleton | skeleton.tsx | 骨架屏加载状态 |
| Sonner (Toaster) | sonner.tsx | Toast 通知 |
| Tabs | tabs.tsx | 标签切换 |

#### GeneratedAvatar 组件

文件: [src/components/GeneratedAvatar.tsx](file:///c:/Users/62370/.qclaw/workspace/companion-play/src/components/GeneratedAvatar.tsx)

- **`GeneratedAvatar`**: 使用 DiceBear Avataaars API 生成卡通头像，根据 seed 哈希值动态选择表情组合和背景色，同一 seed 始终返回相同头像
- **`SafeAvatar`**: 封装组件，有真实头像 URL 则显示真实图片，否则回退到 GeneratedAvatar

#### 全局样式系统

文件: [src/app/globals.css](file:///c:/Users/62370/.qclaw/workspace/companion-play/src/app/globals.css)

采用二次元（Anime）风格设计系统：

| CSS 变量 | 值 | 说明 |
|----------|-----|------|
| `--color-primary` | `#ff6b9d` | 粉色主色调 |
| `--color-secondary` | `#c084fc` | 紫色辅助色 |
| `--color-accent` | `#fbbf24` | 金色强调色 |
| `--color-bg` | `#0f0f1a` | 深色背景 |
| `--color-surface` | `#1a1a2e` | 表面色 |
| `--color-card` | `#16213e` | 卡片色 |
| `--color-border` | `#2d2d44` | 边框色 |
| `--color-text` | `#e2e8f0` | 主文字色 |
| `--color-muted` | `#94a3b8` | 次要文字色 |

预定义样式类：
- `.glow-card` — 粉色发光卡片效果
- `.btn-gradient` — 粉紫渐变按钮
- `.tag-gradient` — 渐变标签
- `.glass` — 毛玻璃效果

---

## 7. 关键类与函数说明

### 7.1 `useAuth` Hook

**文件**: [src/hooks/useAuth.ts](file:///c:/Users/62370/.qclaw/workspace/companion-play/src/hooks/useAuth.ts)

```typescript
interface AuthUser {
  id: string; phone: string; role: string;
  nickname: string; avatar: string | null; bio: string | null;
}

function useAuth(): {
  user: AuthUser | null;    // 当前登录用户
  token: string | null;     // JWT Token
  loading: boolean;         // 初始化加载状态
  login(phone, password): Promise<data>;   // 登录
  register(formData): Promise<data>;       // 注册
  logout(): void;                          // 登出
}
```

- Token 和用户信息存储在 `localStorage`（key: `dazistar_token`, `dazistar_user`）
- `login()` 和 `register()` 内部调用 API 并自动存储 token
- `logout()` 清除 localStorage 中的数据

### 7.2 `useSocket` Hook

**文件**: [src/hooks/useSocket.ts](file:///c:/Users/62370/.qclaw/workspace/companion-play/src/hooks/useSocket.ts)

```typescript
function useSocket(userId: string | null): {
  socket: Socket | null;    // Socket.IO 客户端实例
  connected: boolean;       // 连接状态
}
```

- 当 `userId` 变化时自动重连
- 连接成功后自动发送 `"auth"` 事件注册用户身份
- 组件卸载时自动断开连接
- 传输方式: websocket 优先，fallback 到 polling

### 7.3 认证工具函数

**文件**: [src/lib/auth.ts](file:///c:/Users/62370/.qclaw/workspace/companion-play/src/lib/auth.ts)

| 函数 | 签名 | 说明 |
|------|------|------|
| `hashPassword` | `(password: string) => string` | bcrypt hash, salt=10 |
| `comparePassword` | `(password: string, hash: string) => boolean` | 密码比对 |
| `signToken` | `(payload: {userId, role}) => string` | JWT 签发, 7天有效期 |
| `verifyToken` | `(token: string) => {userId, role} \| null` | JWT 验证 |
| `getTokenFromRequest` | `(req: Request) => string \| null` | 从 Header 提取 Bearer Token |

### 7.4 Prisma 客户端

**文件**: [src/lib/prisma.ts](file:///c:/Users/62370/.qclaw/workspace/companion-play/src/lib/prisma.ts)

- 导出单例 `prisma`，开发环境下使用 `globalThis` 缓存避免热重载时创建多个实例

### 7.5 Socket.IO 服务端

**文件**: [src/lib/socket.ts](file:///c:/Users/62370/.qclaw/workspace/companion-play/src/lib/socket.ts)

| 函数 | 说明 |
|------|------|
| `initSocket(httpServer)` | 初始化 Socket.IO 并绑定到 HTTP Server，注册事件处理 |
| `getIO()` | 获取 Socket.IO Server 实例（供 API Routes 使用） |

### 7.6 API Routes 一览

| 路由 | 方法 | 认证 | 说明 |
|------|------|------|------|
| `/api/auth/register` | POST | 否 | 注册新用户，自动创建角色档案 |
| `/api/auth/login` | POST | 否 | 登录，返回 JWT Token |
| `/api/auth/me` | GET | 是 | 获取当前用户完整信息（含 Profile） |
| `/api/users` | GET | 可选 | 用户列表/详情查询 |
| `/api/conversations` | GET | 是 | 获取当前用户的会话列表 |
| `/api/conversations` | POST | 是 | 创建或查找与目标用户的会话 |
| `/api/conversations/[id]/messages` | GET | 是 | 获取会话消息（最近100条） |
| `/api/conversations/[id]/messages` | POST | 是 | 发送消息，自动更新会话摘要 |

### 7.7 cn() 工具函数

**文件**: [src/lib/utils.ts](file:///c:/Users/62370/.qclaw/workspace/companion-play/src/lib/utils.ts)

```typescript
function cn(...inputs: ClassValue[]): string
```

组合 `clsx`（条件类名合并）和 `tailwind-merge`（Tailwind 类名冲突解决），是 shadcn/ui 的标准工具函数。

---

## 8. 依赖关系图

```
package.json
├── 运行时核心
│   ├── next 16.2.4          (Next.js 框架)
│   ├── react 19.2.4         (UI 库)
│   ├── react-dom 19.2.4     (React DOM 渲染)
│   └── typescript ^5        (类型系统)
│
├── 数据库 & ORM
│   ├── @prisma/client ^5.22.0  (Prisma 客户端)
│   └── prisma ^5.22.0          (Prisma CLI, 迁移/生成)
│
├── 认证
│   ├── jsonwebtoken ^9.0.2  (JWT 签发与验证)
│   ├── bcryptjs ^3.0.2      (密码哈希)
│   └── zod ^4.3.6           (数据校验)
│
├── 实时通信
│   ├── socket.io ^4.8.3          (服务端 WebSocket)
│   └── socket.io-client ^4.8.3   (客户端 WebSocket)
│
├── UI & 样式
│   ├── tailwindcss ^4             (CSS 框架)
│   ├── @tailwindcss/postcss ^4    (PostCSS 插件)
│   ├── class-variance-authority   (组件 variants 管理)
│   ├── clsx ^2.1.1               (类名拼接)
│   ├── tailwind-merge ^3.5.0     (类名合并)
│   ├── lucide-react ^1.11.0      (图标库)
│   ├── @base-ui/react ^1.4.1    (shadcn/ui 基础组件库)
│   └── sonner ^2.0.7            (Toast 通知)
│
├── 表单
│   ├── react-hook-form ^7.74.0   (表单状态管理)
│   └── @hookform/resolvers ^5.2.2 (Zod 集成)
│
├── 其他
│   ├── next-themes ^0.4.6    (主题切换)
│   ├── zustand ^5.0.12       (全局状态管理)
│   ├── emoji-picker-react    (Emoji 选择器)
│   └── next-auth ^5.0.0-beta.31 (NextAuth, 未完全使用)
│
└── 开发依赖
    ├── @types/bcryptjs, @types/jsonwebtoken
    ├── @types/node, @types/react, @types/react-dom
    └── eslint, eslint-config-next
```

---

## 9. 项目运行方式

### 9.1 环境要求

- **Node.js** >= 18 (部署建议 Node.js 22)
- **PostgreSQL** 数据库
- **npm** 或 pnpm

### 9.2 环境变量

创建 `.env` 文件：

```env
# 数据库连接
DATABASE_URL="postgresql://用户名:密码@localhost:5432/数据库名"

# JWT 密钥
JWT_SECRET="your-jwt-secret-key"

# NextAuth (未完全使用)
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-nextauth-secret"

# 运行环境
NODE_ENV="development"
PORT=3000
```

### 9.3 本地开发

```bash
# 1. 安装依赖
npm install

# 2. 生成 Prisma 客户端
npx prisma generate

# 3. 初始化数据库
npx prisma db push

# 4. 启动开发服务器 (Next.js 内置, 端口 3000)
npm run dev
```

打开浏览器访问 `http://localhost:3000`。

> **注意**: `npm run dev` 使用 Next.js 内置服务器，不支持 Socket.IO。如需测试实时通信功能，请使用 `npm start` 或 `node server.js`。

### 9.4 生产构建

```bash
# 1. 构建
npm run build

# 2. 方式 A: 通过自定义服务器启动 (支持 Socket.IO)
npm start                    # 等同于 node server.js

# 3. 方式 B: 仅 Next.js (无 Socket.IO)
npm run next-start
```

`npm start` 启动的是 [server.js](file:///c:/Users/62370/.qclaw/workspace/companion-play/server.js)，它创建一个 HTTP Server，同时承载 Next.js 应用和 Socket.IO WebSocket 服务。

### 9.5 代码检查

```bash
npm run lint
```

---

## 10. 部署说明

### 10.1 PM2 部署（生产环境）

使用 [ecosystem.config.js](file:///c:/Users/62370/.qclaw/workspace/companion-play/ecosystem.config.js) 配置双实例：

```bash
pm2 start ecosystem.config.js
```

| 实例名 | 端口 | 说明 |
|--------|------|------|
| dazistar-3000 | 3000 | **生产**（www.dazistar.com） |
| dazistar-3001 | 3001 | **测试**（test.dazistar.com） |

详见 [docs/ENVIRONMENTS.md](docs/ENVIRONMENTS.md)。实名/店铺验真方案见 [docs/design/verification-v1.md](docs/design/verification-v1.md)。

### 10.2 一键部署脚本

[deploy.sh](file:///c:/Users/62370/.qclaw/workspace/companion-play/deploy.sh) 包含完整的服务器部署流程：

1. 安装系统依赖 (nginx, PostgreSQL 等)
2. 安装 Node.js 22
3. 安装 PM2
4. 初始化 PostgreSQL (创建 `dazistar` 数据库和用户)
5. 克隆代码 (`https://github.com/Xizh994/companion-play.git`)
6. 配置环境变量
7. 安装依赖 + Prisma 生成 + 数据库推送 + 构建
8. 配置 Nginx 反向代理 + SSL (Let's Encrypt certbot)
9. 通过 PM2 启动应用

### 10.3 Nginx 反代配置

```nginx
server {
    listen 80;
    server_name dazistar.com www.dazistar.com;
    
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

> 关键：`Upgrade` 和 `Connection` 头配置确保 WebSocket 连接能穿透 Nginx 代理。

### 10.4 部署地址

| 资源 | 地址 |
|------|------|
| 服务器 IP | `43.140.68.245` |
| 域名 | `dazistar.com` |
| 代码仓库 | `https://github.com/Xizh994/companion-play` |

---

## 附录: 开发注意事项

1. **当前状态**: 发现页、个人中心、陪玩师/店铺资料页使用 Mock 数据，需后续接入真实 API
2. **NextAuth**: 虽然安装了 `next-auth` 依赖，但实际认证是通过自定义 JWT + localStorage 实现的，未使用 NextAuth
3. **Zustand**: 已安装但未在代码中实际使用（状态通过 hooks + localStorage 管理）
4. **Socket.IO 双重实现**: `server.js` 和 `src/lib/socket.ts` 存在两份实现，实际生产使用的是 `server.js`
5. **安全性建议**: 
   - 生产环境务必修改 `JWT_SECRET` 默认值
   - 身份证号等敏感字段需加密存储
   - 目前缺少 `bcryptjs` 前端传输加密（密码明文传输到服务端）
6. **Next.js 版本**: 使用的是 Next.js 16，API 可能与旧版有差异，参考 `AGENTS.md` 中的提示
