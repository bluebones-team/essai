import { sign, verify } from 'jsonwebtoken';
import { env, pick } from 'shared';
import { date_ts } from 'shared/data';

export const dataCreater = {
  pid() {
    return 1;
  },
  otp(num = 6) {
    const code = '' + Math.floor(Math.random() * 10 ** num);
    return code.padStart(num, '0');
  },
  mid() {
    return 1;
  },
  msg(
    opts: Pick<Shared.Message, 'uid' | 'type' | 'title' | 'content'>,
  ): Shared.Message {
    const mid = dataCreater.mid();
    return {
      ...opts,
      mid,
      t: date_ts(Date.now()),
      read: false,
    };
  },
};

export type TokenPayload = Pick<User.Own, 'phone' | 'uid'>;
export const tokenMgr = {
  secret: env('JWT_SECRET_KEY'),
  create(data: TokenPayload): Shared.Token {
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
