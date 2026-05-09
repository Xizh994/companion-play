import Dypnsapi20170525, {
  SendSmsVerifyCodeRequest,
  CheckSmsVerifyCodeRequest,
} from "@alicloud/dypnsapi20170525";

// 模板代码映射
const TEMPLATE_CODES = {
  register: "100001", // 登录/注册模板
  login: "100001", // 登录/注册模板
  changePhone: "100002", // 修改绑定手机号模板
  resetPassword: "100003", // 重置密码模板
  bindPhone: "100004", // 绑定新手机号模板
  verifyPhone: "100005", // 验证绑定手机号模板
};

// 运行时获取环境变量
function getEnv() {
  return {
    ALIYUN_ACCESS_KEY_ID: process.env.ALIYUN_ACCESS_KEY_ID || "",
    ALIYUN_ACCESS_KEY_SECRET: process.env.ALIYUN_ACCESS_KEY_SECRET || "",
    ALIYUN_SMS_SIGN_NAME: process.env.ALIYUN_SMS_SIGN_NAME || "速通互联验证码",
  };
}

function createClient(): Dypnsapi20170525 {
  const env = getEnv();
  // @ts-expect-error - runtime accepts plain object but types require toMap
  const client = new Dypnsapi20170525({
    accessKeyId: env.ALIYUN_ACCESS_KEY_ID,
    accessKeySecret: env.ALIYUN_ACCESS_KEY_SECRET,
    endpoint: "dypnsapi.aliyuncs.com",
  });
  return client;
}

export async function sendSmsCode(
  phone: string,
  _code: string, // 这个参数不再使用，保留兼容
  purpose: keyof typeof TEMPLATE_CODES = "login"
): Promise<{ requestId: string; code?: string }> {
  const env = getEnv();
  
  console.log("[SMS] 检查环境变量 -> ALIYUN_ACCESS_KEY_ID:", env.ALIYUN_ACCESS_KEY_ID ? "已设置" : "未设置");

  if (!env.ALIYUN_ACCESS_KEY_ID) {
    const mockCode = "123456";
    console.log("[SMS MOCK] sendSmsCode ->", phone, mockCode, "purpose:", purpose);
    return { requestId: "mock-" + Date.now(), code: mockCode };
  }

  const templateCode = TEMPLATE_CODES[purpose] || TEMPLATE_CODES.login;

  console.log("[SMS] 发送短信 -> phone:", phone, "让阿里云生成验证码", "templateCode:", templateCode);

  const client = createClient();
  const request = new SendSmsVerifyCodeRequest({
    signName: env.ALIYUN_SMS_SIGN_NAME,
    templateCode: templateCode,
    phoneNumber: phone,
    templateParam: JSON.stringify({ code: "##code##", min: "5" }), // 让阿里云自己生成验证码
    codeLength: 6, // 6位验证码
    validTime: 300, // 5分钟有效期
  });

  const response = await client.sendSmsVerifyCode(request);
  console.log("[SMS] API 响应 ->", JSON.stringify(response.body));

  if (response.body?.code !== "OK") {
    throw new Error(`短信发送失败: ${response.body?.message || response.body?.code}`);
  }

  // 获取阿里云生成的验证码（如果有返回）
  const generatedCode = response.body?.model?.verifyCode as string | undefined;

  return { 
    requestId: response.body?.requestId || response.body?.model?.requestId || "",
    code: generatedCode 
  };
}

export async function verifySmsCode(phone: string, code: string): Promise<boolean> {
  const env = getEnv();

  if (!env.ALIYUN_ACCESS_KEY_ID) {
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

  // 检查阿里云返回的结果
  const model = response.body?.model;
  const codeResult = response.body?.code;
  
  console.log("[SMS] 验证详情 -> code:", codeResult, "model:", model);

  // 如果 code === "OK" 就算验证通过
  if (codeResult === "OK") {
    return true;
  }

  // 检查 model 是否等于 "PASS"
  if (typeof model === "string" && model === "PASS") {
    return true;
  }

  return false;
}
