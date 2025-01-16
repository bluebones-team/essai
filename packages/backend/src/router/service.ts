import { randomInt, randomUUID } from 'crypto';
import EventEmitter from 'events';
import { sign, verify } from 'jsonwebtoken';
import { env, pick } from 'shared';
import { date2ts } from 'shared/data';
import { o } from '~/util';
import { db, redis, sms } from '../client';

export type TokenPayload = Pick<BTables['user'], 'phone' | 'uid'>;
export const tokenMgr = {
  secret: env('JWT_SECRET_KEY'),
  create(data: TokenPayload): Shared['token'] {
    const payload: TokenPayload = pick(data, ['phone', 'uid']);
    return {
      access: sign(payload, tokenMgr.secret, { expiresIn: '15m' }),
      refresh: sign(payload, tokenMgr.secret, { expiresIn: '7d' }),
    };
  },
  verify(token: string) {
    const { promise, resolve, reject } = Promise.withResolvers<TokenPayload>();
    verify(token, tokenMgr.secret, (err, decoded) => {
      // @ts-ignore
      err
        ? reject(err)
        : typeof decoded !== 'object'
          ? reject('Invalid payload')
          : resolve(pick(decoded, ['phone', 'uid']));
    });
    return promise;
  },
};
export const otpMgr = {
  phone: {
    toCode(num: number) {
      return randomInt(10 ** (num - 1), 10 ** num - 1)
        .toString()
        .padStart(num, '0');
    },
    toCacheKey: (phone: string) => `phone:${phone}`,
    async send(phone: string) {
      const code = otpMgr.phone.toCode(6);
      const key = otpMgr.phone.toCacheKey(phone);
      if (await redis.get(key)) return o.fail('验证码已发送，请稍后再试');
      if (!(await sms.send(phone, code))) return o.fail('验证码发送失败');
      console.debug(`Sending OTP code ${code} to ${phone}`);
      await redis.set(key, code, { EX: 5 * 60 }); // 5分钟过期
    },
    async verify(phone: string, code: string) {
      const key = otpMgr.phone.toCacheKey(phone);
      const authCode = await redis.get(key);
      if (!authCode) return o.fail('验证码过期');
      if (authCode !== code) return o.fail('验证码错误');
      await redis.del(key);
    },
  },
  email: {
    send() {},
    verify() {},
  },
};
export const msgMgr = new (class extends EventEmitter {
  on(event: 'send', listener: (data: BTables['message']) => void) {
    return super.on(event, listener);
  }
  async send(data: Omit<BTables['message'], 'mid' | 'read' | 'created_at'>) {
    await db
      .insert('message', {
        ...data,
        mid: randomUUID(),
        read: false,
        created_at: date2ts(new Date()),
      })
      .execute();
    return super.emit('send', data);
  }
})();
export const expMgr = {
  toCacheKey: (eid: number) => `exp:${eid}`,
  async get(eid: number) {
    const key = expMgr.toCacheKey(eid);
    const text = await redis.get(key);
    if (text) return JSON.parse(text) as BTables['experiment'];
    const experiments = await db.select('experiment', { eid }).execute();
    if (experiments.length !== 1)
      return o.error('ID重复', 'experiment.eid', eid);
    const experiment = experiments[0];
    await redis.set(key, JSON.stringify(experiment), { EX: 30 * 24 * 60 * 60 });
    return experiment;
  },
};
