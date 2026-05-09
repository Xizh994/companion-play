import Dypnsapi20170525, {
  SendSmsVerifyCodeRequest,
  CheckSmsVerifyCodeRequest,
} from "@alicloud/dypnsapi20170525";

const ALIYUN_ACCESS_KEY_ID = process.env.ALIYUN_ACCESS_KEY_ID || "";
const ALIYUN_ACCESS_KEY_SECRET = process.env.ALIYUN_ACCESS_KEY_SECRET || "";
const ALIYUN_SMS_SIGN_NAME = process.env.ALIYUN_SMS_SIGN_NAME || "速通互联验证码";

// 模板代码映射
const TEMPLATE_CODES = {
  register: "100001", // 登录/注册模板
  login: "100001", // 登录/注册模板
  changePhone: "100002", // 修改绑定手机号模板
  resetPassword: "100003", // 重置密码模板
  bindPhone: "100004", // 绑定新手机号模板
  verifyPhone: "100005", // 验证绑定手机号模板
};

function createClient(): Dypnsapi20170525 {
  // @ts-expect-error - runtime accepts plain object but types require toMap
  const client = new Dypnsapi20170525({
    accessKeyId: ALIYUN_ACCESS_KEY_ID,
    accessKeySecret: ALIYUN_ACCESS_KEY_SECRET,
    endpoint: "dypnsapi.aliyuncs.com",
  });
  return client;
}

export async function sendSmsCode(
  phone: string,
  code: string,
  purpose: keyof typeof TEMPLATE_CODES = "login"
): Promise<{ requestId: string }> {
  if (!ALIYUN_ACCESS_KEY_ID) {
    console.log("[SMS MOCK] sendSmsCode ->", phone, code, "purpose:", purpose);
    return { requestId: "mock-" + Date.now() };
  }

  const templateCode = TEMPLATE_CODES[purpose] || TEMPLATE_CODES.login;

  console.log("[SMS] 发送短信 -> phone:", phone, "code:", code, "templateCode:", templateCode);

  const client = createClient();
  const request = new SendSmsVerifyCodeRequest({
    signName: ALIYUN_SMS_SIGN_NAME,
    templateCode: templateCode,
    phoneNumber: phone,
    templateParam: JSON.stringify({ code, min: "5" }), // 添加 min 参数
  });

  const response = await client.sendSmsVerifyCode(request);
  console.log("[SMS] API 响应 ->", JSON.stringify(response.body));

  if (response.body?.code !== "OK") {
    throw new Error(`短信发送失败: ${response.body?.message || response.body?.code}`);
  }

  return { requestId: response.body?.requestId || response.body?.model?.requestId || "" };
}

export async function verifySmsCode(phone: string, code: string): Promise<boolean> {
  if (!ALIYUN_ACCESS_KEY_ID) {
    console.log("[SMS MOCK] verifySmsCode ->", phone, code, "-> OK");
    return true;
  }

  console.log("[SMS] 验证短信 -> phone:", phone, "code:", code);

  const client = createClient();
  const request = new CheckSmsVerifyCodeRequest({
    phoneNumber: phone,
    verifyCode: code,
  });

  const response = await client.checkSmsVerifyCode(request);
  console.log("[SMS] 验证响应 ->", JSON.stringify(response.body));

  const model = response.body?.model as string | undefined;
  return model === "PASS";
}
