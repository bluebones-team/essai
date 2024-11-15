import AliyunClient, { SendSmsRequest } from '@alicloud/dysmsapi20170525';
import { Config } from '@alicloud/openapi-client';
import { RuntimeOptions } from '@alicloud/tea-util';
import pino from 'pino';
import { env } from 'shared';

const client = new AliyunClient(
  Object.assign(
    /**@see https://help.aliyun.com/document_detail/378664.html */
    new Config({
      accessKeyId: env('ALIBABA_CLOUD_ACCESS_KEY_ID'),
      accessKeySecret: env('ALIBABA_CLOUD_ACCESS_KEY_SECRET'),
    }),
    /**@see https://api.aliyun.com/product/Dysmsapi */
    { endpoint: `dysmsapi.aliyuncs.com` },
  ),
);

export const sms = {
  /**OTP code expiration time in seconds */
  OTP_EX: 60 as const,
  /**@todo: implement SMS sending */
  async send(phone: string, code: string) {
    return true;
    const sendSmsRequest = new SendSmsRequest({
      phoneNumbers: phone,
      signName: env('SIGN'),
      templateCode: env('CODE_TEMPLATE_ID'),
      templateParam: `{"code":${code}}`,
    });
    const runtime = new RuntimeOptions({});
    try {
      const res = await client.sendSmsWithOptions(sendSmsRequest, runtime);
      pino().info(res);
      return true;
    } catch (error: any) {
      // 错误 message
      console.error('SMS error', error.message, error.data);
      return false;
    }
  },
};
