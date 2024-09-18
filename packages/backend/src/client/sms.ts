// This file is auto-generated, don't edit it
// 依赖的模块可通过下载工程中的模块依赖文件或右上角的获取 SDK 依赖信息查看
import AliyunClient, { SendSmsRequest } from '@alicloud/dysmsapi20170525';
import * as OpenApi from '@alicloud/openapi-client';
import * as Util from '@alicloud/tea-util';
import pino from 'pino';
import { output } from '~/routes';

/**
 * 使用AK&SK初始化账号Client
 * @return Client
 * @throws Exception
 */
const createClient = (): AliyunClient => {
  // 工程代码泄露可能会导致 AccessKey 泄露，并威胁账号下所有资源的安全性。以下代码示例仅供参考。
  // 建议使用更安全的 STS 方式，更多鉴权访问方式请参见：https://help.aliyun.com/document_detail/378664.html。
  const config = new OpenApi.Config({
    // 必填，请确保代码运行环境设置了环境变量 ALIBABA_CLOUD_ACCESS_KEY_ID。
    accessKeyId: process.env['ALIBABA_CLOUD_ACCESS_KEY_ID'],
    // 必填，请确保代码运行环境设置了环境变量 ALIBABA_CLOUD_ACCESS_KEY_SECRET。
    accessKeySecret: process.env['ALIBABA_CLOUD_ACCESS_KEY_SECRET'],
  });
  // Endpoint 请参考 https://api.aliyun.com/product/Dysmsapi
  config.endpoint = `dysmsapi.aliyuncs.com`;
  return new AliyunClient(config);
};
const smsClient = createClient();

export const sendCodeSms = async (phone: string, code: number) => {
  const sendSmsRequest = new SendSmsRequest({
    phoneNumbers: phone,
    signName: process.env['SIGN'],
    templateCode: process.env['CODE_TEMPLATE_ID'],
    templateParam: `{"code":${code}}`,
  });
  const runtime = new Util.RuntimeOptions({});
  try {
    // 复制代码运行请自行打印 API 的返回值
    const res = await smsClient.sendSmsWithOptions(sendSmsRequest, runtime);
    pino().info(res);
    return output.succ(null);
  } catch (error: any) {
    // 错误 message
    console.error('SMS error', error.message);
    console.log(error.data['Recommend']);
    return output.fail('短信发送失败');
  }
};
