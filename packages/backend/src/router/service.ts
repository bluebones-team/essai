import { randomInt } from 'crypto';
import EventEmitter from 'events';
import { sign, verify } from 'jsonwebtoken';
import type { SelectExpression, SelectQueryBuilder } from 'kysely';
import { env, pick } from 'shared';
import { date2ts, ExperimentState, MessageType } from 'shared/data';
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
  async send<D extends Omit<BTables['message'], 'mid' | 'read' | 'created_at'>>(
    data: D extends { type: (typeof MessageType)['Sys.Announcement']['value'] }
      ? Omit<D, 'uid'>
      : D,
  ) {
    await db
      .create('message', {
        ...data,
        read: false,
        created_at: date2ts(new Date()),
      })
      .execute();
    return super.emit('send', data);
  }
})();
export const userCacher = (function () {
  function xidFactory<K extends string, TB extends keyof BTables>(
    name: K,
    toQuery: (uid: number) => SelectQueryBuilder<BTables, TB, {}>,
    field: Exclude<SelectExpression<BTables, TB>, `${string}.${string}`>,
  ) {
    const key = (uid: number) => `uid:${uid}.${name}`;
    async function cacheXids(uid: number) {
      const k = key(uid);
      if (await redis.exists(k)) {
        log.info('hit', `cache ${k}`);
        return null;
      }
      const xids = (await toQuery(uid).select(field).execute()).map(
        (e) => e[field] + '',
      );
      redis.sAdd(k, xids).then(
        (val) => log.info(val, `cache ${k}`),
        (err) => log.error(err, `cache ${k}`),
      );
      return xids;
    }
    async function getXids(uid: number) {
      const k = key(uid);
      return (await cacheXids(uid)) ?? redis.sMembers(k);
    }
    async function isXid(uid: number, xid: number | string) {
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
      'eid',
    ),
    ...xidFactory(
      'OwnEid',
      (uid) => db.selectFrom('experiment').where('uid', '=', uid).selectAll(),
      'eid',
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
      'rid',
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
      'rcid',
    ),
  };
})();
export const expCacher = {
  key: (eid: number) => `eid:${eid}`,
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
  async get(eid: number) {
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
  async getList(eids: number[]) {
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
        typeof e === 'number' ? acc[0].push(e) : acc[1].push(e);
        return acc;
      },
      [[], []] as [number[], BTables['experiment'][]],
    );
    const restExpsQuery = db
      .selectFrom('experiment')
      .where('eid', 'in', restEids)
      .selectAll();
    return [cachedExps, restExpsQuery];
  },
};
export const experimentService = {
  public: {
    is: (experiment: BTables['experiment']) =>
      experiment.state === ExperimentState.Passed.value,
    query: () =>
      db
        .selectFrom('experiment')
        .select(['eid', 'uid', 'title', 'type', 'position', 'notice'])
        .innerJoin('recruitment', (join) =>
          join
            .onRef('recruitment.eid', '=', 'experiment.eid')
            .on('experiment.state', '=', ExperimentState.Passed.value),
        ),
  },
  joined: {
    async is(experiment: BTables['experiment'], uid: number) {
      const data = (await db
        .selectNoFrom((eb) => [
          eb
            .exists(
              eb
                .selectFrom('recruitment_participant')
                .select((eb) => eb.lit(1).as('_'))
                .innerJoin('recruitment_condition', (join) =>
                  join
                    .onRef(
                      'recruitment_condition.rcid',
                      '=',
                      'recruitment_participant.rcid',
                    )
                    .on('recruitment_participant.uid', '=', uid),
                )
                .innerJoin('recruitment', (join) =>
                  join
                    .onRef('recruitment.rid', '=', 'recruitment_condition.rid')
                    .on('recruitment.eid', '=', experiment.eid),
                ),
            )
            .as('is_joined'),
        ])
        .executeTakeFirst())!;
      return data.is_joined;
    },
    query: (uid: number) =>
      db
        .selectFrom('experiment')
        .select(['eid', 'uid', 'title', 'type', 'position', 'notice'])
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
  },
  own: {
    is: (experiment: BTables['experiment'], uid: number) =>
      experiment.uid === uid,
    query: (uid: number) =>
      db
        .selectFrom('experiment')
        .select(['eid', 'uid', 'state', 'title', 'type', 'position', 'notice'])
        .innerJoin('recruitment', (join) =>
          join
            .onRef('recruitment.eid', '=', 'experiment.eid')
            .on('experiment.uid', '=', uid),
        ),
  },
  filter: (data?: FTables['experiment']['filter']['data']) =>
    ((query) =>
      data
        ? query.where((eb) => {
            let query = eb
              .and({
                'experiment.type': data.type,
                'experiment.state': data.state,
              })
              .and('recruitment.rtype', '=', data.rtype);
            if (data.search) {
              query = query.and('experiment.title', 'like', data.search);
            }
            if (data.duration_range) {
              const subQuery = eb
                .selectFrom(
                  eb
                    .fn('unnest', ['recruitment.durations'])
                    .as('durations_value'),
                )
                //@ts-ignore
                .select((eb) => [eb.fn.avg('durations_value')]);
              query = query.and(eb.between(subQuery, ...data.duration_range));
            }
            if (data.times_range) {
              query = query.and(
                eb.between(
                  eb.fn('array_length', ['recruitment.durations', eb.lit(1)]),
                  ...data.times_range,
                ),
              );
            }
            if (data.fee_range) {
              query = query.and(
                eb.between('recruitment.fee', ...data.fee_range),
              );
            }
            return query;
          })
        : query) as Handler<SelectQueryBuilderAny>,
};
