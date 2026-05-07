# 认证系统全面改造 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将现有手机号+密码登录系统升级为短信验证码登录、邮箱绑定/Magic Link紧急登录、BOSS实名认证、修改密码的完整认证体系。

**Architecture:** 基于 Next.js 16 App Router + Prisma + JWT + bcrypt，新增阿里云号码认证(短信验证码)、Resend(邮件验证码+Magic Link)、AES-256加密身份证号。验证码采用即填即验模式。

**Tech Stack:** Next.js 16.2.4, React 19, Prisma 5, PostgreSQL, jsonwebtoken, bcryptjs, @alicloud/dypnsapi20170525, resend, crypto-js

---

## Phase 0: 环境准备

### Task 0.0: 安装新依赖

**Files:**
- Modify: `package.json`

- [ ] **Step 1: 安装阿里云SDK和邮件服务依赖**

```bash
cd c:\Users\62370\.qclaw\workspace\companion-play
npm install @alicloud/dypnsapi20170525 resend crypto-js
```

- [ ] **Step 2: 安装类型定义**

```bash
npm install -D @types/crypto-js
```

- [ ] **Step 3: 验证安装**

```bash
npm ls @alicloud/dypnsapi20170525 resend crypto-js
```

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add aliyun sms, resend email, crypto-js dependencies"
```

---

## Phase 1: 数据库 Schema 变更

### Task 1.0: 更新 Prisma Schema

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: 更新 UserRole 枚举（移除 PLAYER）并更新 User 模型**

在 `prisma/schema.prisma` 中修改：

```prisma
enum UserRole {
  BOSS
  SHOP
}

enum VerificationCodeType {
  SMS_REGISTER
  SMS_LOGIN
  EMAIL_BIND
  EMAIL_RECOVERY
  EMAIL_CHANGE_PWD
}

enum RealNameStatus {
  PENDING
  APPROVED
  REJECTED
}

model User {
  id                String    @id @default(cuid())
  phone             String    @unique
  passwordHash      String?
  email             String?   @unique
  emailVerified     Boolean   @default(false)
  hasPassword       Boolean   @default(true)
  role              UserRole  @default(BOSS)
  nickname          String
  avatar            String?
  bio               String?
  status            String    @default("online")
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt

  playerProfile        PlayerProfile?
  shopProfile          ShopProfile?
  verification         Verification?
  realNameVerification RealNameVerification?
  sentMessages         Message[]       @relation("SentMessages")
  receivedMessages     Message[]       @relation("ReceivedMessages")
  verificationCodes    VerificationCode[]
}
```

保持其他模型（PlayerProfile, ShopProfile, Verification, Message, Conversation）不变。

新增两个模型，添加到 schema 末尾：

```prisma
model VerificationCode {
  id        String              @id @default(cuid())
  userId    String?
  user      User?               @relation(fields: [userId], references: [id], onDelete: Cascade)
  target    String
  code       String
  type      VerificationCodeType
  expiresAt DateTime
  used      Boolean             @default(false)
  createdAt DateTime            @default(now())

  @@index([target, type])
  @@index([expiresAt])
}

model RealNameVerification {
  id            String          @id @default(cuid())
  userId        String          @unique
  user          User            @relation(fields: [userId], references: [id], onDelete: Cascade)
  realName      String
  idCardNumber  String
  status        RealNameStatus  @default(PENDING)
  notes         String?
  submittedAt   DateTime        @default(now())
  verifiedAt    DateTime?

  @@index([status])
}
```

- [ ] **Step 2: 运行 Prisma 迁移**

```bash
npx prisma migrate dev --name auth_system_upgrade
```

- [ ] **Step 3: 更新 seed.ts**

更新 `prisma/seed.ts`，创建新的测试用户（有邮箱绑定）：

```typescript
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // 清理旧数据
  await prisma.verificationCode.deleteMany()
  await prisma.realNameVerification.deleteMany()
  await prisma.verification.deleteMany()
  await prisma.shopProfile.deleteMany()
  await prisma.playerProfile.deleteMany()
  await prisma.message.deleteMany()
  await prisma.conversation.deleteMany()
  await prisma.user.deleteMany()

  // 创建店铺测试用户
  const shopUser = await prisma.user.create({
    data: {
      phone: '13800000001',
      passwordHash: '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
      email: 'shop@dazistar.com',
      emailVerified: true,
      hasPassword: true,
      role: 'SHOP',
      nickname: '星耀陪玩店',
      status: 'online',
    },
  })

  await prisma.shopProfile.create({
    data: {
      userId: shopUser.id,
      shopName: '星耀陪玩店',
      shopDesc: '专业游戏陪玩，24小时在线',
      licenseType: '企业',
      licenseImage: '/uploads/license-placeholder.png',
      contactName: '张店长',
      contactPhone: '13800000001',
      verificationStatus: 'APPROVED',
    },
  })

  // 创建老板测试用户
  const bossUser = await prisma.user.create({
    data: {
      phone: '13800000002',
      passwordHash: '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
      email: 'boss@dazistar.com',
      emailVerified: true,
      hasPassword: true,
      role: 'BOSS',
      nickname: '游戏大王',
      status: 'online',
    },
  })

  console.log('Seed completed:', { shopUser: shopUser.id, bossUser: bossUser.id })
}

main()
  .then(async () => { await prisma.$disconnect() })
  .catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1) })
```

运行 seed：

```bash
npx prisma db seed
```

- [ ] **Step 4: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/ prisma/seed.ts
git commit -m "feat: add email, verification code, real-name verification to schema"
```

---

## Phase 2: 工具与服务层

### Task 2.0: AES 加密工具

**Files:**
- Create: `src/lib/crypto.ts`

- [ ] **Step 1: 创建加密工具文件**

```typescript
import CryptoJS from 'crypto-js'

const getKey = () => {
  const key = process.env.AES_ENCRYPTION_KEY
  if (!key) throw new Error('AES_ENCRYPTION_KEY is not set')
  return key
}

export function encryptIdCard(idCardNumber: string): string {
  return CryptoJS.AES.encrypt(idCardNumber, getKey()).toString()
}

export function decryptIdCard(encrypted: string): string {
  const bytes = CryptoJS.AES.decrypt(encrypted, getKey())
  return bytes.toString(CryptoJS.enc.Utf8)
}
```

### Task 2.1: 阿里云短信服务

**Files:**
- Create: `src/lib/sms.ts`

- [ ] **Step 1: 创建短信服务文件**

```typescript
import Dysmsapi20170525, * as $Dysmsapi20170525 from '@alicloud/dypnsapi20170525'
import * as $OpenApi from '@alicloud/openapi-client'

const createClient = () => {
  const config = new $OpenApi.Config({
    accessKeyId: process.env.ALIYUN_ACCESS_KEY_ID!,
    accessKeySecret: process.env.ALIYUN_ACCESS_KEY_SECRET!,
  })
  config.endpoint = 'dypnsapi.aliyuncs.com'
  return new Dysmsapi20170525(config)
}

export async function sendSmsCode(phone: string): Promise<string> {
  const client = createClient()
  const request = new $Dysmsapi20170525.SendSmsVerifyCodeRequest({
    phoneNumber: phone,
    signName: process.env.ALIYUN_SMS_SIGN_NAME,
    templateCode: process.env.ALIYUN_SMS_TEMPLATE_CODE,
    templateParam: '',
    smsUpExtendCode: '',
  })

  const response = await client.sendSmsVerifyCode(request)
  if (response.body.code !== 'OK') {
    throw new Error(`SMS send failed: ${response.body.message}`)
  }
  return response.body.bizId!
}

export async function verifySmsCode(phone: string, code: string): Promise<boolean> {
  const client = createClient()
  const request = new $Dysmsapi20170525.CheckSmsVerifyCodeRequest({
    phoneNumber: phone,
    verifyCode: code,
  })

  const response = await client.checkSmsVerifyCode(request)
  return response.body.code === 'OK' && response.body.model === 'PASS'
}
```

### Task 2.2: 邮件服务 (Resend)

**Files:**
- Create: `src/lib/email.ts`

- [ ] **Step 1: 创建邮件服务文件**

```typescript
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

const FROM_EMAIL = 'dazistar@resend.dev'

export async function sendVerificationEmail(email: string, code: string): Promise<void> {
  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: '搭子星 - 邮箱验证码',
    html: `<div style="font-family:sans-serif;max-width:480px;margin:0 auto">
      <h2>📧 邮箱验证码</h2>
      <p>您的验证码是：</p>
      <div style="font-size:32px;font-weight:bold;letter-spacing:6px;text-align:center;padding:16px;background:#f0f0f0;border-radius:8px">${code}</div>
      <p style="color:#666;font-size:14px">验证码 5 分钟内有效，请勿泄露给他人。</p>
    </div>`,
  })
  if (error) throw new Error(`Email send failed: ${error.message}`)
}

export async function sendMagicLink(email: string, token: string): Promise<void> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
  const magicLink = `${baseUrl}/api/auth/verify-magic-link?token=${token}`

  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: '搭子星 - 紧急登录链接',
    html: `<div style="font-family:sans-serif;max-width:480px;margin:0 auto">
      <h2>⚡ 紧急登录</h2>
      <p>点击下方按钮登录您的搭子星账号：</p>
      <div style="text-align:center;margin:24px 0">
        <a href="${magicLink}" style="display:inline-block;padding:12px 32px;background:#0071e3;color:white;text-decoration:none;border-radius:8px;font-size:16px">立即登录</a>
      </div>
      <p style="color:#666;font-size:14px">此链接 5 分钟内有效，点击后立即失效，请勿分享给他人。</p>
      <p style="color:#999;font-size:12px">如果不是您本人操作，请忽略此邮件。</p>
    </div>`,
  })
  if (error) throw new Error(`Magic link send failed: ${error.message}`)
}
```

### Task 2.3: 验证码管理服务

**Files:**
- Create: `src/lib/verification.ts`

- [ ] **Step 1: 创建验证码管理文件**

```typescript
import { prisma } from '@/lib/prisma'
import { randomInt } from 'crypto'

const RATE_LIMIT_SECONDS = 60
const CODE_EXPIRY_MINUTES = 5

export async function canSendCode(target: string, type: string): Promise<boolean> {
  const recent = await prisma.verificationCode.findFirst({
    where: {
      target,
      type: type as any,
      createdAt: {
        gte: new Date(Date.now() - RATE_LIMIT_SECONDS * 1000),
      },
    },
  })
  return !recent
}

export async function createVerificationCode(
  target: string,
  userId: string | null,
  type: string,
): Promise<string> {
  const code = String(randomInt(100000, 999999))

  await prisma.verificationCode.create({
    data: {
      target,
      userId,
      code,
      type: type as any,
      expiresAt: new Date(Date.now() + CODE_EXPIRY_MINUTES * 60 * 1000),
    },
  })

  return code
}

export async function verifyCode(
  target: string,
  code: string,
  type: string,
): Promise<boolean> {
  const record = await prisma.verificationCode.findFirst({
    where: {
      target,
      code,
      type: type as any,
      used: false,
      expiresAt: { gte: new Date() },
    },
    orderBy: { createdAt: 'desc' },
  })

  if (!record) return false

  await prisma.verificationCode.update({
    where: { id: record.id },
    data: { used: true },
  })

  return true
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/crypto.ts src/lib/sms.ts src/lib/email.ts src/lib/verification.ts
git commit -m "feat: add AES encryption, SMS, email, and verification code services"
```

---

## Phase 3: API 路由

### Task 3.0: 更新 .env 示例

**Files:**
- Modify: `prisma/seed.ts` (done above)
- Modify: `.env.example`

- [ ] **Step 1: 更新 .env.example**

```env
DATABASE_URL="postgresql://dazistar:DaziStar2026!@localhost:5432/dazistar"
JWT_SECRET="change-me-to-a-random-64-char-string"
AES_ENCRYPTION_KEY="change-me-to-a-random-32-char-string"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="change-me-to-a-random-string"
ALIYUN_ACCESS_KEY_ID="your-aliyun-access-key-id"
ALIYUN_ACCESS_KEY_SECRET="your-aliyun-access-key-secret"
ALIYUN_SMS_SIGN_NAME="搭子星"
ALIYUN_SMS_TEMPLATE_CODE="SMS_XXXXXXXXX"
RESEND_API_KEY="re_xxxxxxxxxxxx"
NEXT_PUBLIC_BASE_URL="http://localhost:3000"
NODE_ENV="production"
PORT=3000
```

### Task 3.1: 发送短信验证码 API

**Files:**
- Create: `src/app/api/auth/send-sms-code/route.ts`

- [ ] **Step 1: 创建路由文件**

```typescript
import { NextResponse } from 'next/server'
import { sendSmsCode } from '@/lib/sms'
import { canSendCode } from '@/lib/verification'

export async function POST(request: Request) {
  try {
    const { phone } = await request.json()
    if (!phone || !/^1[3-9]\d{9}$/.test(phone)) {
      return NextResponse.json({ error: '手机号格式不正确' }, { status: 400 })
    }

    const canSend = await canSendCode(phone, 'SMS_REGISTER')
    if (!canSend) {
      return NextResponse.json({ error: '请 60 秒后再试' }, { status: 429 })
    }

    const bizId = await sendSmsCode(phone)
    return NextResponse.json({ bizId, message: '验证码已发送' })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || '发送失败' }, { status: 500 })
  }
}
```

### Task 3.2: 校验短信验证码 API

**Files:**
- Create: `src/app/api/auth/verify-sms-code/route.ts`

- [ ] **Step 1: 创建路由文件**

```typescript
import { NextResponse } from 'next/server'
import { verifySmsCode } from '@/lib/sms'
import { sign } from 'jsonwebtoken'

const shortTokenSecret = process.env.JWT_SECRET || 'dazistar-jwt-secret-2026'

export async function POST(request: Request) {
  try {
    const { phone, code } = await request.json()
    if (!phone || !code) {
      return NextResponse.json({ valid: false, error: '参数不完整' }, { status: 400 })
    }

    const valid = await verifySmsCode(phone, code)
    if (!valid) {
      return NextResponse.json({ valid: false, error: '验证码错误或已过期' })
    }

    const verifiedToken = sign(
      { phone, type: 'sms', iat: Math.floor(Date.now() / 1000) },
      shortTokenSecret,
      { expiresIn: '10m' }
    )

    return NextResponse.json({ valid: true, verifiedToken })
  } catch (error: any) {
    return NextResponse.json({ valid: false, error: error.message || '校验失败' }, { status: 500 })
  }
}
```

### Task 3.3: 发送邮箱验证码 API

**Files:**
- Create: `src/app/api/auth/send-email-code/route.ts`

- [ ] **Step 1: 创建路由文件**

```typescript
import { NextResponse } from 'next/server'
import { sendVerificationEmail } from '@/lib/email'
import { canSendCode, createVerificationCode } from '@/lib/verification'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const { email, type } = await request.json()
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: '邮箱格式不正确' }, { status: 400 })
    }

    const codeType = type || 'EMAIL_BIND'

    const canSend = await canSendCode(email, codeType)
    if (!canSend) {
      return NextResponse.json({ error: '请 60 秒后再试' }, { status: 429 })
    }

    // 注册时检查邮箱唯一性
    if (codeType === 'EMAIL_BIND') {
      const existing = await prisma.user.findUnique({ where: { email } })
      if (existing) {
        return NextResponse.json({ error: '该邮箱已被其他账号绑定' }, { status: 409 })
      }
    }

    // 紧急登录时检查邮箱是否存在
    if (codeType === 'EMAIL_RECOVERY') {
      const existing = await prisma.user.findFirst({
        where: { email, emailVerified: true },
      })
      if (!existing) {
        return NextResponse.json({ error: '该邮箱未注册，请先创建账号' }, { status: 404 })
      }
    }

    const code = await createVerificationCode(email, null, codeType)
    await sendVerificationEmail(email, code)

    return NextResponse.json({ message: '验证码已发送' })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || '发送失败' }, { status: 500 })
  }
}
```

### Task 3.4: 校验邮箱验证码 API

**Files:**
- Create: `src/app/api/auth/verify-email-code/route.ts`

- [ ] **Step 1: 创建路由文件**

```typescript
import { NextResponse } from 'next/server'
import { verifyCode } from '@/lib/verification'
import { sign } from 'jsonwebtoken'

const shortTokenSecret = process.env.JWT_SECRET || 'dazistar-jwt-secret-2026'

export async function POST(request: Request) {
  try {
    const { email, code, type } = await request.json()
    if (!email || !code) {
      return NextResponse.json({ valid: false, error: '参数不完整' }, { status: 400 })
    }

    const codeType = type || 'EMAIL_BIND'
    const valid = await verifyCode(email, code, codeType)
    if (!valid) {
      return NextResponse.json({ valid: false, error: '验证码错误或已过期' })
    }

    const verifiedToken = sign(
      { email, type: 'email', codeType, iat: Math.floor(Date.now() / 1000) },
      shortTokenSecret,
      { expiresIn: '10m' }
    )

    return NextResponse.json({ valid: true, verifiedToken })
  } catch (error: any) {
    return NextResponse.json({ valid: false, error: error.message || '校验失败' }, { status: 500 })
  }
}
```

### Task 3.5: 邮箱唯一性检查 API

**Files:**
- Create: `src/app/api/auth/check-email-unique/route.ts`

- [ ] **Step 1: 创建路由文件**

```typescript
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const { email } = await request.json()
    if (!email) {
      return NextResponse.json({ available: false, error: '邮箱不能为空' }, { status: 400 })
    }

    const existing = await prisma.user.findUnique({ where: { email } })
    return NextResponse.json({ available: !existing })
  } catch (error: any) {
    return NextResponse.json({ available: false, error: error.message }, { status: 500 })
  }
}
```

### Task 3.6: Magic Link 发送 API

**Files:**
- Create: `src/app/api/auth/send-magic-link/route.ts`

- [ ] **Step 1: 创建路由文件**

```typescript
import { NextResponse } from 'next/server'
import { sendMagicLink } from '@/lib/email'
import { canSendCode, createVerificationCode } from '@/lib/verification'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const { email } = await request.json()
    if (!email) {
      return NextResponse.json({ error: '邮箱不能为空' }, { status: 400 })
    }

    const canSend = await canSendCode(email, 'MAGIC_LINK')
    if (!canSend) {
      return NextResponse.json({ error: '请 60 秒后再试' }, { status: 429 })
    }

    // 检查邮箱是否存在有效用户
    const user = await prisma.user.findFirst({
      where: { email, emailVerified: true },
    })
    if (!user) {
      return NextResponse.json({ error: '该邮箱未注册，请先创建账号' }, { status: 404 })
    }

    const token = await createVerificationCode(email, user.id, 'MAGIC_LINK')
    await sendMagicLink(email, token)

    return NextResponse.json({ message: '登录链接已发送至您的邮箱' })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || '发送失败' }, { status: 500 })
  }
}
```

### Task 3.7: Magic Link 回调 API

**Files:**
- Create: `src/app/api/auth/verify-magic-link/route.ts`

- [ ] **Step 1: 创建路由文件**

```typescript
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { signToken } from '@/lib/auth'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')
    if (!token) {
      return NextResponse.redirect(new URL('/login?error=invalid_link', request.url))
    }

    const record = await prisma.verificationCode.findFirst({
      where: { code: token, type: 'MAGIC_LINK', used: false, expiresAt: { gte: new Date() } },
    })
    if (!record || !record.userId) {
      return NextResponse.redirect(new URL('/login?error=link_expired', request.url))
    }

    // 标记已使用
    await prisma.verificationCode.update({
      where: { id: record.id },
      data: { used: true },
    })

    const user = await prisma.user.findUnique({ where: { id: record.userId } })
    if (!user) {
      return NextResponse.redirect(new URL('/login?error=user_not_found', request.url))
    }

    const jwtToken = signToken({ userId: user.id, role: user.role })

    const response = NextResponse.redirect(new URL('/discover', request.url))
    response.cookies.set('dazistar_token', jwtToken, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    })
    return response
  } catch (error: any) {
    return NextResponse.redirect(new URL('/login?error=unknown', request.url))
  }
}
```

### Task 3.8: 更新注册 API

**Files:**
- Modify: `src/app/api/auth/register/route.ts`

- [ ] **Step 1: 重写注册路由 — 完整代码**

```typescript
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword, signToken } from '@/lib/auth'
import { verify } from 'jsonwebtoken'

const shortTokenSecret = process.env.JWT_SECRET || 'dazistar-jwt-secret-2026'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { phone, phoneVerifiedToken, role, nickname, password, email, emailVerifiedToken, shopName, shopDesc, contactName, contactPhone } = body

    // 校验手机 verifiedToken
    let phonePayload: any
    try {
      phonePayload = verify(phoneVerifiedToken, shortTokenSecret) as any
    } catch {
      return NextResponse.json({ error: '手机验证已过期，请重新验证' }, { status: 400 })
    }
    if (phonePayload.phone !== phone || phonePayload.type !== 'sms') {
      return NextResponse.json({ error: '手机验证不匹配' }, { status: 400 })
    }

    // 校验邮箱 verifiedToken
    let emailPayload: any
    try {
      emailPayload = verify(emailVerifiedToken, shortTokenSecret) as any
    } catch {
      return NextResponse.json({ error: '邮箱验证已过期，请重新验证' }, { status: 400 })
    }
    if (emailPayload.email !== email || emailPayload.type !== 'email' || emailPayload.codeType !== 'EMAIL_BIND') {
      return NextResponse.json({ error: '邮箱验证不匹配' }, { status: 400 })
    }

    // 检查手机号是否已注册
    const existingPhone = await prisma.user.findUnique({ where: { phone } })
    if (existingPhone) {
      return NextResponse.json({ error: '该手机号已注册' }, { status: 409 })
    }

    // 检查邮箱是否被占用（双重保险）
    const existingEmail = await prisma.user.findUnique({ where: { email } })
    if (existingEmail) {
      return NextResponse.json({ error: '该邮箱已被其他账号绑定' }, { status: 409 })
    }

    if (!role || !['BOSS', 'SHOP'].includes(role)) {
      return NextResponse.json({ error: '角色无效' }, { status: 400 })
    }

    // 创建用户
    const user = await prisma.user.create({
      data: {
        phone,
        passwordHash: password ? hashPassword(password) : null,
        hasPassword: !!password,
        email,
        emailVerified: true,
        role: role as 'BOSS' | 'SHOP',
        nickname: nickname || '用户' + phone.slice(-4),
      },
    })

    // 店铺：创建 ShopProfile
    if (role === 'SHOP' && shopName) {
      await prisma.shopProfile.create({
        data: {
          userId: user.id,
          shopName,
          shopDesc: shopDesc || '',
          licenseType: '企业',
          contactName: contactName || '',
          contactPhone: contactPhone || phone,
          verificationStatus: 'PENDING',
        },
      })
    }

    const token = signToken({ userId: user.id, role: user.role })

    return NextResponse.json({
      token,
      user: {
        id: user.id,
        phone: user.phone,
        role: user.role,
        nickname: user.nickname,
        email: user.email,
        avatar: user.avatar,
        bio: user.bio,
      },
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || '注册失败' }, { status: 500 })
  }
}
```

### Task 3.9: 更新登录 API（支持短信验证码登录）

**Files:**
- Modify: `src/app/api/auth/login/route.ts`

- [ ] **Step 1: 重写登录路由 — 完整代码**

```typescript
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { comparePassword, signToken } from '@/lib/auth'
import { verifySmsCode } from '@/lib/sms'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { phone, password, smsCode, method } = body

    if (!phone || !/^1[3-9]\d{9}$/.test(phone)) {
      return NextResponse.json({ error: '手机号格式不正确' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { phone } })
    if (!user) {
      return NextResponse.json({ error: '该手机号未注册' }, { status: 404 })
    }

    // 短信验证码登录
    if (method === 'sms' || (!password && smsCode)) {
      if (!smsCode) {
        return NextResponse.json({ error: '请输入验证码' }, { status: 400 })
      }
      const smsValid = await verifySmsCode(phone, smsCode)
      if (!smsValid) {
        return NextResponse.json({ error: '验证码错误或已过期' }, { status: 400 })
      }
    } else {
      // 密码登录
      if (!password) {
        return NextResponse.json({ error: '请输入密码' }, { status: 400 })
      }
      if (!user.passwordHash) {
        return NextResponse.json({ error: '该账号未设置密码，请使用短信验证码登录' }, { status: 400 })
      }
      const valid = comparePassword(password, user.passwordHash)
      if (!valid) {
        return NextResponse.json({ error: '密码错误' }, { status: 400 })
      }
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { status: 'online' },
    })

    const token = signToken({ userId: user.id, role: user.role })

    return NextResponse.json({
      token,
      user: {
        id: user.id,
        phone: user.phone,
        role: user.role,
        nickname: user.nickname,
        email: user.email,
        avatar: user.avatar,
        bio: user.bio,
      },
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || '登录失败' }, { status: 500 })
  }
}
```

### Task 3.10: 修改密码 API

**Files:**
- Create: `src/app/api/auth/change-password/route.ts`

- [ ] **Step 1: 创建路由文件**

```typescript
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword, verifyToken } from '@/lib/auth'
import { verifySmsCode } from '@/lib/sms'
import { verifyCode } from '@/lib/verification'
import { verify } from 'jsonwebtoken'

const shortTokenSecret = process.env.JWT_SECRET || 'dazistar-jwt-secret-2026'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { token: authToken, method, newPassword, code, verifiedToken: vToken } = body

    if (!authToken || !newPassword || newPassword.length < 6) {
      return NextResponse.json({ error: '新密码至少6位' }, { status: 400 })
    }

    const payload = verifyToken(authToken)
    if (!payload) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({ where: { id: payload.userId } })
    if (!user) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 })
    }

    // 验证身份
    if (method === 'phone' || !method) {
      // 优先手机短信验证
      if (!code) {
        return NextResponse.json({ error: '请输入验证码' }, { status: 400 })
      }
      const valid = await verifySmsCode(user.phone, code)
      if (!valid) {
        return NextResponse.json({ error: '短信验证码错误或已过期' }, { status: 400 })
      }
    } else if (method === 'email') {
      // 校验 email verifiedToken
      let emailPayload: any
      try {
        emailPayload = verify(vToken, shortTokenSecret) as any
      } catch {
        return NextResponse.json({ error: '邮箱验证已过期' }, { status: 400 })
      }
      if (emailPayload.type !== 'email' || emailPayload.codeType !== 'EMAIL_CHANGE_PWD') {
        return NextResponse.json({ error: '邮箱验证不匹配' }, { status: 400 })
      }
    } else {
      return NextResponse.json({ error: '无效的验证方式' }, { status: 400 })
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: hashPassword(newPassword),
        hasPassword: true,
      },
    })

    return NextResponse.json({ message: '密码修改成功' })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || '修改失败' }, { status: 500 })
  }
}
```

### Task 3.11: BOSS 实名认证 API

**Files:**
- Create: `src/app/api/auth/verify-identity/route.ts`

- [ ] **Step 1: 创建路由文件**

```typescript
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'
import { encryptIdCard } from '@/lib/crypto'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { authToken, realName, idCardNumber } = body

    if (!authToken) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const payload = verifyToken(authToken)
    if (!payload || payload.role !== 'BOSS') {
      return NextResponse.json({ error: '仅老板角色可进行实名认证' }, { status: 403 })
    }

    if (!realName || !idCardNumber) {
      return NextResponse.json({ error: '请填写完整的身份信息' }, { status: 400 })
    }

    if (!/^\d{17}[\dXx]$/.test(idCardNumber)) {
      return NextResponse.json({ error: '身份证号格式不正确' }, { status: 400 })
    }

    // 检查是否已有认证记录
    const existing = await prisma.realNameVerification.findUnique({
      where: { userId: payload.userId },
    })
    if (existing && existing.status !== 'REJECTED') {
      return NextResponse.json({ error: '您已提交过实名认证，请等待审核' }, { status: 409 })
    }

    if (existing && existing.status === 'REJECTED') {
      // 更新被拒绝的记录
      await prisma.realNameVerification.update({
        where: { userId: payload.userId },
        data: {
          realName,
          idCardNumber: encryptIdCard(idCardNumber),
          status: 'PENDING',
          submittedAt: new Date(),
          notes: null,
        },
      })
    } else {
      await prisma.realNameVerification.create({
        data: {
          userId: payload.userId,
          realName,
          idCardNumber: encryptIdCard(idCardNumber),
          status: 'PENDING',
        },
      })
    }

    return NextResponse.json({ message: '实名认证已提交，审核通过后即可发送消息' })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || '提交失败' }, { status: 500 })
  }
}
```

### Task 3.12: 更新 /api/auth/me（增加邮箱和认证状态）

**Files:**
- Modify: `src/app/api/auth/me/route.ts`

- [ ] **Step 1: 更新返回字段**

将 `select` 部分更新为包含新字段：

```typescript
const user = await prisma.user.findUnique({
  where: { id: payload.userId },
  include: {
    playerProfile: true,
    shopProfile: true,
    realNameVerification: {
      select: { status: true, submittedAt: true },
    },
  },
})

if (!user) {
  return NextResponse.json({ error: '用户不存在' }, { status: 404 })
}

return NextResponse.json({
  user: {
    id: user.id,
    phone: user.phone,
    role: user.role,
    nickname: user.nickname,
    email: user.email,
    emailVerified: user.emailVerified,
    hasPassword: user.hasPassword,
    identityVerified: user.realNameVerification?.status === 'APPROVED',
    avatar: user.avatar,
    bio: user.bio,
    playerProfile: user.playerProfile,
    shopProfile: user.shopProfile,
  },
})
```

- [ ] **Step 2: Commit all API routes**

```bash
git add src/app/api/auth/
git commit -m "feat: add SMS/email verification, magic link, change password, identity verification APIs"
```

---

## Phase 4: 前端页面

### Task 4.0: 更新 middleware（添加新公开路径）

**Files:**
- Modify: `src/middleware.ts`

- [ ] **Step 1: 更新公开路径列表**

```typescript
const PUBLIC_PATHS = ['/login', '/register', '/change-password', '/profile']
const PUBLIC_PREFIXES = [
  '/api/',
  '/_next/',
  '/shop/',
  '/profile/',
  '/favicon.ico',
]
```

注意：`/profile` 在 PUBLIC_PATHS 中，这样未登录用户会看到引导登录提示；但登录用户可以正常访问。也可以考虑让 profile 需要登录。

**决策：** `/profile` 不加入 PUBLIC_PATHS，让 middleware 拦截未登录用户重定向到登录页。只有在 PUBLIC_PREFIXES 中保留 `/profile/` 前缀以兼容旧逻辑。

```typescript
const PUBLIC_PATHS = ['/login', '/register']
const PUBLIC_PREFIXES = [
  '/api/',
  '/_next/',
  '/shop/',
  '/favicon.ico',
]
```

### Task 4.1: 更新 useAuth hook（支持新登录方式）

**Files:**
- Modify: `src/hooks/useAuth.ts`

- [ ] **Step 1: 更新 AuthUser 接口和 hook**

```typescript
export interface AuthUser {
  id: string
  phone: string
  role: string
  nickname: string
  email?: string | null
  emailVerified?: boolean
  hasPassword?: boolean
  identityVerified?: boolean
  avatar: string | null
  bio: string | null
}
```

添加新的方法：

```typescript
// smsCodeLogin
const smsLogin = async (phone: string, smsCode: string) => {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, smsCode, method: 'sms' }),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error || '登录失败')
  }
  const data = await res.json()
  setTokenCookie(data.token)
  localStorage.setItem(USER_KEY, JSON.stringify(data.user))
  setUser(data.user)
  setToken(data.token)
  return data
}

// sendSmsCode
const requestSmsCode = async (phone: string) => {
  const res = await fetch('/api/auth/send-sms-code', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone }),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error || '发送失败')
  }
  return res.json()
}

// verifySmsCode
const verifySmsCode = async (phone: string, code: string) => {
  const res = await fetch('/api/auth/verify-sms-code', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, code }),
  })
  return res.json()
}

// sendEmailCode
const requestEmailCode = async (email: string, type: string) => {
  const res = await fetch('/api/auth/send-email-code', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, type }),
  })
  if (!res.ok