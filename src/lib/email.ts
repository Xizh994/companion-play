import { Resend } from "resend";

const RESEND_API_KEY = process.env.RESEND_API_KEY || "";
const EMAIL_FROM = process.env.EMAIL_FROM || "noreply@dazistar.com";

function getResend(): Resend | null {
  if (!RESEND_API_KEY || RESEND_API_KEY === "re_xxxxxxxxxxxx") return null;
  return new Resend(RESEND_API_KEY);
}

export async function sendVerificationEmail(
  to: string,
  code: string
): Promise<{ id: string }> {
  const resend = getResend();
  if (!resend) {
    throw new Error("邮件服务未配置，请在 .env 中设置 RESEND_API_KEY");
  }

  const { data, error } = await resend.emails.send({
    from: EMAIL_FROM,
    to,
    subject: "搭子星 - 邮箱验证码",
    html: buildVerificationEmailHtml(code),
  });

  if (error) throw new Error(error.message);
  return { id: data?.id || "" };
}

export async function sendMagicLink(
  to: string,
  token: string
): Promise<{ id: string }> {
  const resend = getResend();
  if (!resend) {
    throw new Error("邮件服务未配置，请在 .env 中设置 RESEND_API_KEY");
  }

  const magicLink = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/auth/verify-magic-link?token=${token}`;

  const { data, error } = await resend.emails.send({
    from: EMAIL_FROM,
    to,
    subject: "搭子星 - 一键登录",
    html: buildMagicLinkHtml(magicLink),
  });

  if (error) throw new Error(error.message);
  return { id: data?.id || "" };
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
