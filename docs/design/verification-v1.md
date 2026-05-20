# 实名认证与店铺企业验真 · 设计方案 v1

> 状态：已定稿，待阿里云权限开通后按 Phase 实施。  
> 环境说明：[ENVIRONMENTS.md](../ENVIRONMENTS.md)（**3001 = 测试**，**3000 = 生产**）。

## 1. 目标与原则

### 1.1 业务目标

- **老板（BOSS）**：身份证二要素实名校验，通过后解锁大厅全量浏览与聊天（现有 `boss-access` 逻辑）。
- **店铺（SHOP）**：营业执照资料 + 企业要素验真；负责人与法人一致性校验。
- **注册**：账号创建（手机验证）与认证**解耦**——注册成功不等待阿里云核验。

### 1.2 阿里云调用方式

| 能力 | 接口（产品） | HTTP 形态 | 我们系统侧建议 |
|------|--------------|-----------|----------------|
| 自然人二要素 | `Id2MetaVerify`（实人认证 · 信息核验） | **同步** | 个人页提交 → **同步**出结果 |
| 企业三要素 | `EntElementVerify` ENT_3META（企业要素验证） | **同步** | 店铺认证页提交 → **同步**为主；超时再轮询 |
| 执照 OCR | OCR 营业执照识别（票证核验） | **同步** | 有执照图时先 OCR 再要素核验 |

「异步」仅指：**不要阻塞注册 HTTP**；核验 API 本身仍为同步调用，可选用队列做重试，无需依赖阿里云回调。

### 1.3 测试 / 生产策略

- 开发与联调在 **测试环境（3001）** 完成，功能正常后再部署 **生产（3000）**。
- **不做**面向用户的「验真服务开通中，资料已保存」类文案；测试环境与生产使用同一套状态展示（核验中 / 已通过 / 未通过）。
- 后端可用 `verificationNotes.phase` 区分开关未开（仅运维），前端不单独展示「awaiting_aliyun」。

---

## 2. 阿里云侧前置（运营 Checklist）

个人执照办理 → 阿里云账号 **个人实名改企业实名** 后，在控制台开通：

1. 实人认证 → **信息核验**（`Id2MetaVerify`）
2. 实人认证 → **企业要素验证**（`EntElementVerify`，建议 `ENT_3META`）
3. 文字识别 → **票证核验 / 营业执照**（OCR + 可选 `VerifyBusinessLicense`）

RAM：AccessKey 仅部署在服务端；权限示例 `AliyunYundunCloudAuthFullAccess`、`AliyunOCRFullAccess`（或细粒度 OCR action）。

---

## 3. 环境变量

```env
# 老板/负责人 二要素（Id2MetaVerify）
ALIYUN_ID_VERIFY_ENABLED=false
ID_VERIFY_MOCK=false

# 店铺企业要素 + OCR
SHOP_VERIFY_ENABLED=false

# 企业要素场景码（控制台创建）
CLOUDAUTH_SCENE_CODE=

# 已有
ALIYUN_ACCESS_KEY_ID=
ALIYUN_ACCESS_KEY_SECRET=
AES_ENCRYPT_KEY=
```

| 变量 | 测试环境建议 | 生产建议 |
|------|--------------|----------|
| `ALIYUN_ID_VERIFY_ENABLED` | 开通后 `true` | `true` |
| `ID_VERIFY_MOCK` | 无阿里云时 `true` 便于测大厅 | `false` |
| `SHOP_VERIFY_ENABLED` | 开通后 `true` | `true` |

---

## 4. 数据与状态机

### 4.1 老板 `RealNameVerification.status`

| 状态 | 含义 | 前端 |
|------|------|------|
| 无记录 | 未提交 | 「立即实名认证」 |
| `PENDING` | 仅用于 API 超时/暂不可用、可重试 | 「核验中，请稍后刷新」 |
| `APPROVED` | `Id2MetaVerify` BizCode=1 | 「已认证」 |
| `REJECTED` | BizCode=2 或校验失败 | 「未通过」+ 重新提交 |

**不要**使用「人工审核中」文案（除非后续单独做运营复审）。

身份证号：`encrypt()` 后存储。

### 4.2 店铺 `ShopProfile.verificationStatus`

枚举保持：`PENDING | APPROVED | REJECTED`。

子阶段写入 `verificationNotes`（JSON 字符串，供运维与轮询；**前端不必展示「服务未开通」**）：

```json
{
  "phase": "submitted | verifying | done",
  "reason": "用户可读原因",
  "aliyunRequestId": "",
  "bizCode": "1|2|3",
  "ocr": {
    "creditCode": "",
    "companyName": "",
    "legalPerson": ""
  }
}
```

| status | phase | 用户可见 |
|--------|-------|----------|
| `PENDING` | `submitted` | 待核验 / 可点「开始核验」 |
| `PENDING` | `verifying` | 核验中（loading / 轮询） |
| `APPROVED` | `done` | 已认证 |
| `REJECTED` | `done` | 未通过 + 重新提交 |

### 4.3 业务权限（v1）

| 角色 | 条件 | 大厅 | 聊天 | 对外徽章 |
|------|------|------|------|----------|
| BOSS | 未实名 | 预览 2 家 | ❌ | — |
| BOSS | 已实名 | 全部 | ✅ | — |
| SHOP | 未 `APPROVED` | ❌ 老板大厅不可见 | ❌ | 「待核验」/「核验中」 |
| SHOP | `APPROVED` | ✅ 可展示，可排序加权 | ✅ | 「已认证」 |

**店铺核验触发（v1）**：注册仅落库 `PENDING`，**不**在注册接口自动调阿里云；用户须在个人页 **手动点击「开始核验」**（`POST /api/verification/shop/submit`）。注册成功跳转大厅并展示引导横幅。

---

## 5. 后端 API

### 5.1 改造现有接口

| 接口 | 要点 |
|------|------|
| `POST /api/auth/register` | SHOP 必填：店名、负责人、身份证、执照 URL；`contactIdCard` 加密；`verificationStatus=PENDING`，`notes.phase=submitted`；不调阿里云 |
| `POST /api/auth/verify-identity` | 仅 BOSS；内调 `Id2MetaVerify`；同步 `APPROVED`/`REJECTED` |
| `GET /api/auth/me` | 可选返回 `verificationSummary`（badge + message） |
| `GET /api/users?role=SHOP` | 返回 `shopVerified`；可选 APPROVED 优先排序 |

### 5.2 新增接口

```
POST /api/verification/person           # 老板实名（可合并 verify-identity）
POST /api/verification/contact-person     # 店铺更换负责人（二要素 + 更新 contactName）
POST /api/verification/shop/submit        # 提交/重提店铺认证
GET  /api/verification/shop/status        # verifying 时轮询
POST /api/uploads/license                 # 执照上传 → URL
```

### 5.3 店铺提交流程

1. 可选上传执照 → OCR 提取三要素 → 用户确认。
2. 校验 `contactName` 与 OCR 法人姓名一致（不一致直接 REJECTED）。
3. `EntElementVerify` ENT_3META（企业名 + 统一社会信用代码 + 法人姓名）。
4. 写 `APPROVED` / `REJECTED` + `verificationNotes`。

### 5.4 内部模块

`src/lib/aliyun-verify/`（待建）：

- `id2MetaVerify(name, idCard)`
- `recognizeBusinessLicense(imageUrl)`
- `entElementVerify({ licenseNo, entName, legalPersonName })`

---

## 6. 前端状态与页面

### 6.1 统一 Badge（建议 `src/lib/verification-ui.ts`）

```ts
type VerifyBadge = "none" | "pending" | "verifying" | "approved" | "rejected";
```

由 `realNameVerification` / `shopProfile.verificationStatus` + `verificationNotes.phase` 映射。

### 6.2 注册页 `/register`

- BOSS：注册成功 → `/lobby`，提示完成实名（Banner）。
- SHOP：必填校验 + 执照上传 URL；注册不调阿里云；成功 → `/lobby`。

### 6.3 个人页 `/profile`

**BOSS · 实名**

- 提交 → loading → 同步展示通过/失败（无「人工审核」）。

**SHOP · 店铺认证**

- `pending` → 「开始核验」→ `verifying` → 结果。
- `rejected` → 「重新提交」弹窗（执照 + 确认三要素）→ `shop/submit`。
- 更换负责人 → `contact-person`（**禁止**调用仅 BOSS 可用的 `verify-identity`）。

### 6.4 大厅 / 店铺页

- 老板未实名：现有预览条 + CTA。
- 店铺卡片/详情：`shopVerified` 徽章（已认证 / 待认证）。

---

## 7. 时序（简图）

### 老板实名（同步）

```
填写姓名身份证 → POST /verification/person → Id2MetaVerify
  → APPROVED / REJECTED → refreshUser → 大厅权限更新
```

### 店铺认证（同步 + 轮询兜底）

```
POST /shop/submit → phase=verifying → OCR + EntElementVerify
  → 5s 内返回终态；否则 GET /shop/status 轮询
```

---

## 8. 实施阶段

### Phase A（无需阿里云企业权限）

- [x] 注册 SHOP 必填 + 执照上传 + `contactIdCard` 加密
- [x] `verification-ui.ts` + 个人页按 badge 改文案
- [x] `verificationNotes` JSON 规范
- [x] 负责人 API 改为 `contact-person`（骨架）
- [x] 店铺「重新提交」弹窗 + API 骨架

### Phase B（信息核验开通）

- [ ] `Id2MetaVerify` + 老板/负责人同步结果
- [ ] `boss-access` 联调

### Phase C（OCR + 企业要素开通）

- [ ] `shop/submit` 全链路
- [ ] 大厅 `shopVerified` 展示

### Phase D（上线）

- [ ] 隐私政策补充
- [ ] 日志脱敏、监控 RequestId

---

## 9. 与现状差异（改造对照）

| 现状 | 目标 |
|------|------|
| 老板提交后长期 PENDING「审核中」 | 同步核验 → APPROVED/REJECTED |
| 店铺认证不影响业务能力 | v1 仅徽章；可选后续收紧 |
| 执照 base64 入库 | OSS/上传 API URL |
| 负责人更换调 `verify-identity`（403） | `contact-person` |
| 重新提交按钮无逻辑 | `shop/submit` |
| 注册不校验店铺必填 | SHOP 必填 |

---

## 10. 参考链接

- [Id2MetaVerify](https://help.aliyun.com/zh/id-verification/information-verification/developer-reference/vatsl9lfmbwe74iv)
- [EntElementVerify](https://help.aliyun.com/zh/id-verification/enterprise-identity-authentication/developer-reference/enterprise-element-verification)
- [VerifyBusinessLicense](https://help.aliyun.com/zh/ocr/developer-reference/api-ocr-api-2021-07-07-verifybusinesslicense)
