import { sign, verify } from 'jsonwebtoken';
import { env, pick } from 'shared';
import { redis, sms } from '../client';
import { randomInt } from 'node:crypto';

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
      err ? reject(err) : resolve(decoded);
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
      if (await redis.get(key)) return '验证码已发送，请稍后再试';
      if (!(await sms.send(phone, code))) return '验证码发送失败';
      console.debug(`Sending OTP code ${code} to ${phone}`);
      await redis.set(key, code, { EX: 5 * 60 }); // 5分钟过期
    },
    async verify(phone: string, code: string) {
      const key = otpMgr.phone.toCacheKey(phone);
      const authCode = await redis.get(key);
      if (!authCode) return '验证码过期';
      if (authCode !== code) return '验证码错误';
      await redis.del(key);
    },
  },
  email: {
    send() {},
    verify() {},
  },
};
export const msgMgr = {};
