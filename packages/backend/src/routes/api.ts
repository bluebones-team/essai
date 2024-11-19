import type { ParameterizedContext } from 'koa';
import { date_ts, Gender } from 'shared/data';
import type { ApiRecords, Input, Output } from 'shared/router';
import { model, redis, sms } from '~/client';
import { dataCreater, tokenMgr } from '~/service';
import { o } from './util';

export const routes: {
  [P in keyof ApiRecords]?: (
    ctx: ParameterizedContext & { input: Input[P] },
  ) => MaybePromise<Output[P]>;
} = {
  //#region account
  async '/login/pwd'({ input }) {
    const { phone, pwd } = input;
    const user = await model.user.findOne({ phone });
    if (!user) return o('fail', '用户不存在');
    if (user.pwd && user.pwd !== pwd) return o('fail', '密码错误');
    return o('succ', Object.assign(tokenMgr.create(user), user.toOwn()));
  },
  async '/login/otp'({ input }) {
    const { phone, code } = input;
    const authCode = await redis.get(`otp:${phone}`);
    if (!authCode) return o('fail', '请获取验证码');
    if (authCode !== code) return o('fail', '验证码错误');
    const user =
      (await model.user.findOne({ phone })) ??
      (await model.user.add({
        phone,
        gender: Gender.Female.value,
        birthday: date_ts('1990-01-01'),
        pwd: 'accdda',
      }));
    return o('succ', Object.assign(tokenMgr.create(user), user.toOwn()));
  },
  async '/login/token'({ input, user }) {
    return o('succ', user.toOwn());
  },
  async '/logout'({ input, user }) {
    const data = await user.deleteOne();
    return data.acknowledged ? o('succ', void 0) : o('fail', '注销失败');
  },
  async '/token/refresh'({ input, user }) {
    return o('succ', tokenMgr.create(user));
  },
  //#region user
  async '/usr/edit'({ input, user }) {
    await user.updateOne(input);
    return o('succ', void 0);
  },
  async '/usr/pwd/edit'({ input, user }) {
    const { old: oldPwd, new: newPwd } = input;
    if (user.pwd && user.pwd !== oldPwd) return o('fail', '旧密码错误');
    await user.updateOne({ pwd: newPwd });
    return o('succ', void 0);
  },
  async '/usr/phone/otp'({ input }) {
    const phone = input;
    const code = dataCreater.otp();
    console.debug('otp', code);
    if (await redis.get(`otp:${phone}`))
      return o('fail', '验证码已发送，请稍后再试');
    if (!(await sms.send(phone, code))) return o('fail', '短信发送失败');
    await redis.set(`otp:${phone}`, code, { EX: sms.OTP_EX });
    return o('succ', void 0);
  },
  //#region notify
  /**@see https://trpc.io/docs/v10/subscriptions */
  //@ts-ignore
  // 'notify/stream'( {input} ) {
  //   return observable<Output['notify/stream']>((emit) => {
  //     const timer = setInterval(() => {
  //       emit.next(
  //         o(
  //           'succ',
  //           dataCreater.msg({
  //             uid: 1,
  //             type: MessageType.enums[
  //               Math.floor(Math.random() * MessageType.enums.length)
  //             ],
  //             title: 'Title of message',
  //             content:
  //               'In the fantasy world, today, the sky suddenly turned pink...',
  //           }),
  //         ),
  //       );
  //     }, 3e3);
  //     setTimeout(() => clearInterval(timer), 10e3);
  //     return () => clearInterval(timer);
  //   });
  // },
};
