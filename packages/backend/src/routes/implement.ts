import { observable } from '@trpc/server/observable';
import { BizCode, MessageType } from 'shared/data';
import redis from '~/client/redis';
import * as sms from '~/client/sms';
import { UserModel } from '~/db';
import {
  generateCode,
  generateToken,
  generateUserId,
  SMS_CODE_EX,
} from '~/service';
import { output } from '.';
import { toRouter } from './api';

//API 实现
export default toRouter({
  async 'phone/code'({ input, ctx }) {
    const phone = input;
    if (await redis.get(`phone:${phone}`)) {
      return output.fail('验证码已发送，请稍后再试');
    }
    const code = generateCode();
    const res = await sms.sendCodeSms(phone, code);
    if (res.code === BizCode.Success._value) {
      await redis.set(`phone:${phone}`, code, { EX: SMS_CODE_EX });
    }
    return res;
  },
  async 'login/otp'({ input, ctx }) {
    const { phone, code } = input;
    const authCode = await redis.get(`phone:${phone}`);
    if (!authCode) {
      return output.fail('请获取验证码');
    }
    if (authCode !== code.toString()) {
      return output.fail('验证码错误');
    }
    const user =
      (await UserModel.findOne({ phone })) ??
      (await UserModel.create({ id: generateUserId(phone), phone }));
    return output.succ(Object.assign(generateToken(phone, user.id), user));
  },
  //@ts-ignore ws/sse 不提供准确的类型校验
  'notify/stream'({ input, ctx }) {
    return observable((emit) => {
      const timer = setInterval(() => {
        emit.next(
          output.succ({
            uid: 1,
            type: MessageType.System._value,
            title: 'Hello',
            content: 'World',
            t: Math.round(Date.now() / 1e3),
            has_read: false,
          }),
        );
      }, 3e3);
      return () => {
        clearInterval(timer);
      };
    });
  },
});
