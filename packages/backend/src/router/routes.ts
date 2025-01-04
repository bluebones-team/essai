import { pick } from 'shared';
import { date_ts, OutputCode } from 'shared/data';
import { type Router } from 'shared/router';
import { db } from '~/client';
import { otpMgr, tokenMgr } from '~/router/service';
import { o } from '~/util';

const user_own = (data: BTables['user']): FTables['user']['own'] => ({
  ...pick(data, [
    'uid',
    'name',
    'face',
    'gender',
    'birthday',
    'phone',
    'emails',
    'recruiter',
  ]),
  pwd: !!data.pwd,
});
export const routes: Router.Routes = {
  //#region /
  async '/signup'({ input }) {
    const errMsg = await otpMgr.phone.verify(input.phone, input.code);
    if (errMsg) return o('fail', errMsg);
    const user = await db.create('user', {
      name: '张三',
      face: `https://picsum.photos/200?t=${Date.now()}`,
      ...pick(input, ['phone', 'gender', 'birthday']),
      created_at: date_ts(new Date()),
      emails: [],
      recruiter: false,
    });
    return o('succ', Object.assign(tokenMgr.create(user), user_own(user)));
  },
  async '/signoff'({ input, user }) {
    const data = await db.delete('user', user);
    return o('succ');
  },
  async '/login/pwd'({ input }) {
    const { phone, pwd } = input;
    const user = (await db.read('user', { phone }))[0];
    if (!user) return o(OutputCode.NoUser.value);
    if (user.pwd && user.pwd !== pwd) return o('fail', '密码错误');
    return o('succ', Object.assign(tokenMgr.create(user), user_own(user)));
  },
  async '/login/phone'({ input }) {
    const { phone, code } = input;
    const errMsg = await otpMgr.phone.verify(phone, code);
    if (errMsg) return o('fail', errMsg);
    const user = (await db.read('user', { phone }))[0];
    if (!user) return o(OutputCode.NoUser.value);
    return o('succ', Object.assign(tokenMgr.create(user), user_own(user)));
  },
  async '/login/token'({ input, user }) {
    if (!user) return o(OutputCode.Unauthorizen.value);
    return o('succ', user_own(user));
  },
  async '/token/refresh'({ input, user }) {
    if (!user) return o(OutputCode.Unauthorizen.value);
    return o('succ', tokenMgr.create(user));
  },
  async '/otp/phone'({ input }) {
    const errMsg = await otpMgr.phone.send(input);
    if (errMsg) return o('fail', errMsg);
    return o('succ');
  },
  //#endregion /
  //#region /usr
  async '/usr/edit'({ input, user }) {
    await db.update('user', input);
    return o('succ');
  },
  async '/usr/pwd/edit'({ input, user }) {
    if (!user) return o(OutputCode.Unauthorizen.value);
    const { old: oldPwd, new: newPwd } = input;
    if (user.pwd && user.pwd !== oldPwd) return o('fail', '旧密码错误');
    await db.update('user', { pwd: newPwd });
    return o('succ');
  },
  async '/usr/phone/edit'({ input, user }) {
    if (!user) return o(OutputCode.Unauthorizen.value);
    const { old: oldPhone, new: newPhone, code } = input;
    if ((await db.read('user', { phone: newPhone })).length)
      return o('fail', '手机号已被注册');
    const errMsg = await otpMgr.phone.verify(newPhone, code);
    if (errMsg) return o('fail', errMsg);
    if (user.phone !== oldPhone) return o('fail', '旧手机号错误');
    await db.update('user', { phone: newPhone });
    return o('succ');
  },
  //#endregion /usr
  //#region /exp
  //#endregion /exp
};
