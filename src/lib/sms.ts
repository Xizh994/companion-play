import Dypnsapi20170525, {
  SendSmsVerifyCodeRequest,
  CheckSmsVerifyCodeRequest,
} from "@alicloud/dypnsapi20170525";

const ALIYUN_ACCESS_KEY_ID = process.env.ALIYUN_ACCESS_KEY_ID || "";
const ALIYUN_ACCESS_KEY_SECRET = process.env.ALIYUN_ACCESS_KEY_SECRET || "";
const ALIYUN_SMS_SIGN_NAME = process.env.ALIYUN_SMS_SIGN_NAME || "搭子星";
const ALIYUN_SMS_TEMPLATE_CODE = process.env.ALIYUN_SMS_TEMPLATE_CODE || "SMS_123456789";

function createClient(): Dypnsapi20170525 {
  // @ts-expect-error - runtime accepts plain object but types require toMap
  const client = new Dypnsapi20170525({
    accessKeyId: ALIYUN_ACCESS_KEY_ID,
    accessKeySecret: ALIYUN_ACCESS_KEY_SECRET,
    endpoint: "dypnsapi.aliyuncs.com",
  });
  return client;
}

export async function sendSmsCode(phone: string, code: string): Promise<{ requestId: string }> {
  if (!ALIYUN_ACCESS_KEY_ID) {
    console.log("[SMS MOCK] sendSmsCode ->", phone, code);
    return { requestId: "mock-" + Date.now() };
  }

  const client = createClient();
  const request = new SendSmsVerifyCodeRequest({
    signName: ALIYUN_SMS_SIGN_NAME,
    templateCode: ALIYUN_SMS_TEMPLATE_CODE,
    phoneNumber: phone,
    templateParam: JSON.stringify({ code }),
  });

  const response = await client.sendSmsVerifyCode(request);
  return { requestId: response.body?.requestId || "" };
}

export async function verifySmsCode(phone: string, code: string): Promise<boolean> {
  if (!ALIYUN_ACCESS_KEY_ID) {
    console.log("[SMS MOCK] verifySmsCode ->", phone, code, "-> OK");
    return true;
  }

  const client = createClient();
  const request = new CheckSmsVerifyCodeRequest({
    phoneNumber: phone,
    verifyCode: code,
  });

  const response = await client.checkSmsVerifyCode(request);
  const model = response.body?.model as string | undefined;
  return model === "PASS";
}
