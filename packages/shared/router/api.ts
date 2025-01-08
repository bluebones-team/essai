import { z } from 'zod';
import { mapValues } from '..';
import {
  experiment,
  message,
  output,
  param,
  posInt,
  recruitment,
  recruitment_condition,
  recruitment_participant,
  report,
  shared,
  user,
  user_participant,
  type Output,
} from '../data';

export type ApiMeta = {
  type: 'get' | 'post' | 'ws';
  token: keyof Shared['token'] | '';
};
export type ApiRecord<
  Meta extends ApiMeta = ApiMeta,
  In extends z.ZodType = z.ZodType,
  Out extends z.ZodType = z.ZodType,
> = {
  /**request metadata */
  meta: Meta;
  /**request schema */
  in: In;
  /**response schema */
  out: Out;
};
type RawApiRecords = { [K in `/${Lowercase<string>}`]: Partial<ApiRecord> };

const { phone, pwd } = user.back.shape;
const defaultApiRecord = {
  meta: { type: 'post', token: 'access' },
  in: z.nullable(z.undefined()),
  out: z.undefined(),
} satisfies ApiRecord;

function crud<
  T extends string,
  U extends z.ZodRawShape,
  L extends keyof U,
  R extends keyof U,
>(
  path: T,
  schema: z.ZodObject<U>,
  opts: { id: Record<L, true>; readonly: Record<R, true> },
) {
  const id = schema.pick(opts.id as {}) as z.ZodObject<Pick<U, L>>;
  const editable = schema
    .omit(opts.id as {})
    .omit(opts.readonly as {}) as z.ZodObject<Omit<U, L | R>>;
  const kvs = [
    [
      `${path}/c`,
      {
        in: editable,
      },
    ],
    [
      `${path}/u`,
      {
        in: editable.partial().merge(id),
      },
    ],
    [
      `${path}/d`,
      {
        in: id,
      },
    ],
    // [
    //   `${path}/r`,
    //   {
    //     in: id,
    //     out: schema,
    //   },
    // ],
    // [
    //   `${path}/r/ls`,
    //   {
    //     in: param.page,
    //     out: schema.array(),
    //   },
    // ],
  ] as const;
  return Object.fromEntries(kvs) as FromEntries<DeepNonReadonly<typeof kvs>>;
}

const account = {
  '/token/refresh': {
    meta: { type: 'post', token: 'refresh' },
    out: shared.token,
  },
  '/batch': {
    in: z.tuple([z.string(), z.any()]).array().min(2),
    out: output().array().min(2),
  },
  /**密码登录 */
  '/login/pwd': {
    meta: { type: 'post', token: '' },
    in: z.object({ phone, pwd }),
    out: user.front.own.merge(shared.token),
  },
  /**验证码登录 */
  '/login/phone': {
    meta: { type: 'post', token: '' },
    in: z.object({ phone, code: param.code }),
    out: user.front.own.merge(shared.token),
  },
  /**token 登录 */
  '/login/token': {
    out: user.front.own,
  },
  /**发送验证码 */
  '/otp/phone': {
    meta: { type: 'post', token: '' },
    in: phone,
  },
  '/otp/email': {
    in: z.string().email(),
  },
} satisfies RawApiRecords;
const usr = {
  /**注册 */
  '/usr/c': {
    meta: { type: 'post', token: '' },
    in: user.back
      .pick({ phone: true, pwd: true, gender: true, birthday: true })
      .extend({ code: param.code }),
    out: user.front.own.merge(shared.token),
  },
  /**注销 */
  '/usr/d': {},
  /**更改基本信息 */
  '/usr/u': {
    in: user.front.editable.partial(),
  },
  /**修改密码 */
  '/usr/pwd/u': {
    in: z.object({ old: pwd, new: pwd }),
  },
  /**修改手机号 */
  '/usr/phone/u': {
    in: z.object({ old: phone, new: phone, code: param.code }),
  },
  /**添加邮箱 */
  '/usr/email/c': {
    in: z.string().email(),
  },
  /**删除邮箱 */
  '/usr/email/d': {
    in: z.string().email(),
  },
  /**退订邮件消息 */
  '/usr/email/unsub': {
    meta: { type: 'get', token: '' },
  },
  /**参与者库 */
  '/usr/ptc/ls': {
    in: param.page.extend({
      filter: experiment.front.filter.data.pick({ rtype: true }).optional(),
    }),
    out: user_participant.front.array(),
  },
  '/usr/ptc/c': {
    in: param.uid.merge(param.rtype),
  },
  '/usr/ptc/d': {
    in: param.uid.merge(param.rtype),
  },
} satisfies RawApiRecords;
const exp = {
  ...crud('/exp', experiment.front.own.data, {
    id: { eid: true },
    readonly: { state: true, uid: true },
  }),
  '/exp/pub': {
    in: param.eid,
  },
  '/exp/join': {
    in: param.rcid.extend({
      // starts: shared.timestamp.array().optional(),
    }),
  },
  '/exp/push': {
    in: param.rcid.extend({ uids: param.uid.shape.uid.array() }),
  },
  /**公开项目 */
  '/exp/public': {
    meta: { type: 'post', token: '' },
    in: param.eid,
    out: experiment.front.public.data,
  },
  '/exp/public/sup': {
    meta: { type: 'post', token: '' },
    in: param.eid,
    out: experiment.front.public.supply,
  },
  '/exp/public/ls': {
    meta: { type: 'post', token: '' },
    in: param.page.extend({
      filter: experiment.front.filter.data.omit({ state: true }),
    }),
    out: experiment.front.public.preview.array(),
  },
  /**公开项目范围 */
  '/exp/public/range': {
    out: experiment.front.filter.range,
  },
  /**用户参与的项目 */
  '/exp/joined': {
    in: param.eid,
    out: experiment.front.joined.data,
  },
  '/exp/joined/sup': {
    in: param.eid,
    out: experiment.front.joined.supply,
  },
  '/exp/joined/ls': {
    in: param.page.extend({
      filter: experiment.front.filter.data.pick({ rtype: true }).optional(),
    }),
    out: experiment.front.joined.preview.array(),
  },
  /**用户创建的项目 */
  '/exp/own': {
    in: param.eid,
    out: experiment.front.own.data,
  },
  '/exp/own/sup': {
    in: param.eid,
    out: experiment.front.own.supply,
  },
  '/exp/own/ls': {
    in: param.page.extend({
      filter: experiment.front.filter.data.pick({ rtype: true }).optional(),
    }),
    out: experiment.front.own.preview.array(),
  },
} satisfies RawApiRecords;
const recruit = {
  '/recruit/ls': {
    in: param.page.merge(param.eid),
    out: recruitment.front.merge(param.rid).array(),
  },
  '/recruit/c': {
    in: recruitment.front.merge(param.eid),
  },
  '/recruit/u': {
    in: recruitment.front.partial().merge(param.rid),
  },
  '/recruit/d': {
    in: param.rid,
  },
  '/recruit/condition/ls': {
    in: param.page.merge(param.rid),
    out: recruitment_condition.front
      .merge(param.rcid)
      .extend({ count: posInt })
      .array(),
  },
  '/recruit/condition/c': {
    in: recruitment_condition.front.merge(param.rid),
  },
  '/recruit/condition/u': {
    in: recruitment_condition.front.partial().merge(param.rcid),
  },
  '/recruit/condition/d': {
    in: param.rcid,
  },
  '/recruit/ptc/ls': {
    in: param.page.merge(param.rcid),
    out: recruitment_participant.front.array(),
  },
  '/recruit/ptc/d': {
    in: param.rcid.merge(param.uid),
  },
} satisfies RawApiRecords;
const msg = {
  '/msg/stream': {
    meta: { type: 'ws', token: '' }, // debug only
    out: message.front,
  },
  '/msg/ls': {
    in: param.page,
    out: message.front.array(),
  },
  '/msg/read': {
    in: message.front.pick({ mid: true }),
  },
} satisfies RawApiRecords;
/**举报 */
const rpt = {
  '/rpt/exp': {
    in: report.front,
  },
  '/rpt/user': {
    in: report.front,
  },
} satisfies RawApiRecords;
// const sched = {
//   /**公开项目日程 */
//   'public': {
//     in: param.eid.merge(param.rtype),
//     out: experiment.front.public.schedule
//       .omit({ eid: true, rtype: true })
//       .array(),
//   },
//   'joined': {
//     in: param.eid.merge(param.rtype),
//     out: experiment.front.joined.schedule
//       .omit({ eid: true, rtype: true })
//       .array(),
//   },
//   'own': {
//     in: param.eid.merge(param.rtype),
//     out: experiment.front.own.schedule.omit({ eid: true, rtype: true }).array(),
//   },
//   'joined/all': {
//     out: experiment.front.joined.schedule.array(),
//   },
//   'own/all': {
//     out: experiment.front.own.schedule.array(),
//   },
// } satisfies RawApiRecords;
export const apiRecords = (<T extends RawApiRecords>(raw: T) =>
  mapValues(raw, (v, k) => {
    const record = Object.assign({}, defaultApiRecord, v);
    return Object.assign(record, { out: output(record.out) });
  }) as {
    [K in keyof T]: Merge<typeof defaultApiRecord, T[K]> extends infer R extends
      ApiRecord
      ? Merge<R, { out: Output<R['out']> }>
      : never;
  })({
  ...account,
  ...usr,
  ...recruit,
  ...exp,
  ...msg,
  ...rpt,
});
// console.log(apiRecords);

export type ApiRecords = typeof apiRecords;
export type ApiRecordTypes = {
  [P in keyof ApiRecords]: ApiRecords[P] extends infer R extends ApiRecord
    ? { [K in keyof R]: R[K] extends z.ZodType ? z.infer<R[K]> : R[K] }
    : never;
};
export type Path = keyof ApiRecords;
export type In = { [K in keyof ApiRecords]: ApiRecordTypes[K]['in'] };
export type Out = { [K in keyof ApiRecords]: ApiRecordTypes[K]['out'] };
