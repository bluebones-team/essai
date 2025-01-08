import { randomInt, randomUUID } from 'crypto';
import EventEmitter from 'events';
import { sign, verify } from 'jsonwebtoken';
import { type SelectExpression, type SelectQueryBuilder } from 'kysely';
import { env, pick } from 'shared';
import { date2ts } from 'shared/data';
import { db, redis, sms } from '~/client';
import { log, o } from '~/util';

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
      log.debug({ code, phone }, 'send otp code to phone');
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
type SendEvent = BTables['message'];
export const msgMgr = new (class extends EventEmitter {
  on(event: 'send', listener: (data: SendEvent) => void) {
    return super.on(event, listener);
  }
  async send(leastData: Omit<BTables['message'], 'mid' | 'created_at'>) {
    const data = {
      ...leastData,
      mid: randomUUID(),
      created_at: date2ts(new Date()),
    };
    await db.insertInto('message').values(data).execute();
    return super.emit('send', data satisfies SendEvent);
  }
})();
export const userCacher = (function () {
  function xidFactory<K extends string, TB extends keyof BTables>(
    name: K,
    toQuery: (uid: string) => SelectQueryBuilder<BTables, TB, {}>,
    expression: Extract<SelectExpression<BTables, TB>, `${string}.${string}`>,
  ) {
    const key = (uid: string) => `uid:${uid}.${name}`;
    async function cacheXids(uid: string) {
      const k = key(uid);
      if (await redis.exists(k)) {
        log.info('hit', `cache ${k}`);
        return null;
      }
      const field = expression.split('.')[1];
      const xids = (await toQuery(uid).select(expression).execute()).map(
        //@ts-ignore
        (e) => e[field] + '',
      );
      if (xids.length) {
        redis.sAdd(k, xids).then(
          (val) => log.info(val, `cache ${k}: ${val}`),
          (err) => log.error(err, `cache ${k}: ${err}`),
        );
      }
      return xids;
    }
    async function getXids(uid: string) {
      const k = key(uid);
      return (await cacheXids(uid)) ?? redis.sMembers(k);
    }
    async function isXid(uid: string, xid: number | string) {
      const k = key(uid);
      await cacheXids(uid);
      return redis.sIsMember(k, xid + '');
    }
    const kvs = [
      [`get${name}s`, getXids],
      [`is${name}`, isXid],
    ] as const;
    return Object.fromEntries(kvs) as FromEntries<DeepNonReadonly<typeof kvs>>;
  }
  return {
    ...xidFactory(
      'JoinedEid',
      (uid) =>
        db
          .selectFrom('experiment')
          .innerJoin('recruitment', 'recruitment.eid', 'experiment.eid')
          .innerJoin(
            'recruitment_condition',
            'recruitment_condition.rid',
            'recruitment.rid',
          )
          .innerJoin('recruitment_participant', (join) =>
            join
              .onRef(
                'recruitment_participant.rcid',
                '=',
                'recruitment_condition.rcid',
              )
              .on('recruitment_participant.uid', '=', uid),
          ),
      'experiment.eid',
    ),
    ...xidFactory(
      'OwnEid',
      (uid) => db.selectFrom('experiment').where('uid', '=', uid).selectAll(),
      'experiment.eid',
    ),
    ...xidFactory(
      'OwnRid',
      (uid) =>
        db
          .selectFrom('experiment')
          .innerJoin('recruitment', (join) =>
            join
              .onRef('recruitment.eid', '=', 'experiment.eid')
              .on('experiment.uid', '=', uid),
          ),
      'recruitment.rid',
    ),
    ...xidFactory(
      'OwnRcid',
      (uid) =>
        db
          .selectFrom('experiment')
          .innerJoin('recruitment', (join) =>
            join
              .onRef('recruitment.eid', '=', 'experiment.eid')
              .on('experiment.uid', '=', uid),
          )
          .innerJoin(
            'recruitment_condition',
            'recruitment_condition.rid',
            'recruitment.rid',
          ),
      'recruitment_condition.rcid',
    ),
  };
})();
export const expCacher = {
  key: (eid: string) => `eid:${eid}`,
  cache(exp: BTables['experiment']) {
    const k = expCacher.key(exp.eid);
    redis
      .set(k, JSON.stringify(exp), {
        EX: 30 * 24 * 60 * 60,
      })
      .then(
        (val) => log.info(val, `cache ${k}`),
        (err) => log.error(err, `cache ${k}`),
      );
  },
  async get(eid: string) {
    const k = expCacher.key(eid);
    const text = await redis.get(k);
    if (text) {
      log.info('hit', `cache ${k}`);
      return JSON.parse(text) as BTables['experiment'];
    }
    const exp = await db
      .selectFrom('experiment')
      .where('eid', '=', eid)
      .selectAll()
      .executeTakeFirst();
    if (!exp) return null;
    expCacher.cache(exp);
    return exp;
  },
  async getList(eids: string[]) {
    const results = await Promise.all(
      eids.map(async (eid) => {
        const k = expCacher.key(eid);
        const text = await redis.get(k);
        if (text) {
          log.info('hit', `cache ${k}`);
          return JSON.parse(text) as BTables['experiment'];
        }
        return eid;
      }),
    );
    const [restEids, cachedExps] = results.reduce(
      (acc, e) => {
        typeof e === 'string' ? acc[0].push(e) : acc[1].push(e);
        return acc;
      },
      [[], []] as [string[], BTables['experiment'][]],
    );
    const restExpsQuery = db
      .selectFrom('experiment')
      .where('eid', 'in', restEids)
      .selectAll();
    return [cachedExps, restExpsQuery];
  },
};
