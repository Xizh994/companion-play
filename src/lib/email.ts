import "dotenv/config";
import Dm20151123, { SingleSendMailRequest } from "@alicloud/dm20151123";

function getEnv() {
  return {
    ALIYUN_ACCESS_KEY_ID: process.env.ALIYUN_ACCESS_KEY_ID || "",
    ALIYUN_ACCESS_KEY_SECRET: process.env.ALIYUN_ACCESS_KEY_SECRET || "",
    ALIYUN_DM_ACCOUNT_NAME: process.env.ALIYUN_DM_ACCOUNT_NAME || "",
    ALIYUN_DM_FROM_ALIAS: process.env.ALIYUN_DM_FROM_ALIAS || "搭子星",
  };
}

function createClient(): Dm20151123 {
  const env = getEnv();
  // @ts-expect-error - runtime accepts plain object
  const client = new Dm20151123({
    accessKeyId: env.ALIYUN_ACCESS_KEY_ID,
    accessKeySecret: env.ALIYUN_ACCESS_KEY_SECRET,
    endpoint: "dm.aliyuncs.com",
  });
  return client;
}

export async function sendVerificationEmail(
  to: string,
  code: string
): Promise<{ id: string }> {
  const env = getEnv();

  if (!env.ALIYUN_ACCESS_KEY_ID) {
    throw new Error("邮件服务未配置，请在 .env 中设置 ALIYUN_ACCESS_KEY_ID");
  }
  if (!env.ALIYUN_DM_ACCOUNT_NAME) {
    throw new Error("邮件服务未配置，请在 .env 中设置 ALIYUN_DM_ACCOUNT_NAME (阿里云发信地址)");
  }

  const client = createClient();
  const request = new SingleSendMailRequest({
    accountName: env.ALIYUN_DM_ACCOUNT_NAME,
    replyToAddress: "true",
    addressType: "1",
    toAddress: to,
    subject: "搭子星 - 邮箱验证码",
    htmlBody: buildVerificationEmailHtml(code),
    fromAlias: env.ALIYUN_DM_FROM_ALIAS,
  });

  const response = await client.singleSendMail(request);

  if (!response.body?.requestId) {
    throw new Error("邮件发送失败，阿里云未返回 requestId");
  }

  return { id: response.body.requestId };
}

export async function sendMagicLink(
  to: string,
  token: string
): Promise<{ id: string }> {
  const env = getEnv();

  if (!env.ALIYUN_ACCESS_KEY_ID) {
    throw new Error("邮件服务未配置，请在 .env 中设置 ALIYUN_ACCESS_KEY_ID");
  }
  if (!env.ALIYUN_DM_ACCOUNT_NAME) {
    throw new Error("邮件服务未配置，请在 .env 中设置 ALIYUN_DM_ACCOUNT_NAME (阿里云发信地址)");
  }

  const magicLink = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/auth/verify-magic-link?token=${token}`;

  const client = createClient();
  const request = new SingleSendMailRequest({
    accountName: env.ALIYUN_DM_ACCOUNT_NAME,
    replyToAddress: "true",
    addressType: "1",
    toAddress: to,
    subject: "搭子星 - 一键登录",
    htmlBody: buildMagicLinkHtml(magicLink),
    fromAlias: env.ALIYUN_DM_FROM_ALIAS,
  });

  const response2 = await client.singleSendMail(request);

  if (!response2.body?.requestId) {
    throw new Error("邮件发送失败，阿里云未返回 requestId");
  }

  return { id: response2.body.requestId };
}

function buildVerificationEmailHtml(code: string): string {
  return `
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5;">
  <div style="max-width: 480px; margin: 0 auto; background: white; border-radius: 12px; padding: 32px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
    <h2 style="color: #6366f1; margin: 0 0 8px 0;">搭子星</h2>
    <p style="color: #333; font-size: 16px; margin: 24px 0 8px 0;">您的验证码是：</p>
    <div style="background: #f0f0ff; border-radius: 8px; padding: 16px; text-align: center; margin: 12px 0;">
      <span style="font-size: 28px; font-weight: bold; color: #6366f1; letter-spacing: 4px;">${code}</span>
    </div>
    <p style="color: #999; font-size: 13px; margin: 16px 0 0 0;">验证码 5 分钟内有效，请勿泄露给他人。</p>
  </div>
</body>
</html>`;
}

function buildMagicLinkHtml(link: string): string {
  return `
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5;">
  <div style="max-width: 480px; margin: 0 auto; background: white; border-radius: 12px; padding: 32px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
    <h2 style="color: #6366f1; margin: 0 0 8px 0;">搭子星</h2>
    <p style="color: #333; font-size: 16px; margin: 24px 0 8px 0;">点击下方按钮即可一键登录：</p>
    <div style="text-align: center; margin: 24px 0;">
      <a href="${link}" style="display: inline-block; background: #6366f1; color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-size: 16px;">登录搭子星</a>
    </div>
    <p style="color: #999; font-size: 13px; margin: 16px 0 0 0;">此链接 5 分钟内有效，仅可使用一次。如果这不是您的操作，请忽略此邮件。</p>
  </div>
</body>
</html>`;
}
