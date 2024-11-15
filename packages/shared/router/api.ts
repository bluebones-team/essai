import { z } from 'zod';
import { mapValues } from '..';
import {
  filter,
  param,
  participant,
  project,
  report,
  shared,
  user,
} from '../data';

export type ApiMeta = {
  type: 'post' | 'ws';
  token: keyof Shared.Token | '';
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
type CheckApiPath<K> = K extends `${infer P}${string}`
  ? If<
      Eq<P, '/'>,
      "path should't start with /",
      If<Eq<K, Lowercase<K>>, true, 'path should be lowercase'>
    >
  : never;

const defaultApiRecord = {
  meta: { type: 'post', token: 'access' },
  in: z.undefined(),
  out: z.undefined(),
} as const satisfies ApiRecord;
function toApi<T extends Record<string, Partial<ApiRecord>>>(records: {
  [K in keyof T]: If<CheckApiPath<K>, T[K]>;
}) {
  return mapValues(records, (v) => {
    const r: ApiRecord = Object.assign({}, defaultApiRecord, v);
    return Object.assign(r, { out: shared.output(r.out) });
  }) as {
    [K in keyof T]: Merge<typeof defaultApiRecord, T[K]> extends infer R extends
      ApiRecord
      ? Merge<R, { out: ReturnType<typeof shared.output<R['out']>> }>
      : never;
  };
}

const { phone, pwd } = user.model.shape;
const code = z.string().length(6, '验证码长度为 6 位');

export const account = toApi({
  /**密码登录 */
  'login/pwd': {
    meta: { type: 'post', token: '' },
    in: z.object({ phone, pwd }),
    out: user.own.merge(shared.token),
  },
  /**验证码登录 */
  'login/otp': {
    meta: { type: 'post', token: '' },
    in: z.object({ phone, code }),
    out: user.own.merge(shared.token),
  },
  /**token 登录 */
  'login/token': {
    out: user.own,
  },
  /**注销账号 */
  logout: {},
  /**实名认证 */
  'auth/realname': {
    in: user.auth,
  },
  /**招募者认证: 有绑定教育邮箱才能认证 */
  'auth/recruiter': {},
  'token/refresh': {
    meta: { type: 'post', token: 'refresh' },
    out: shared.token,
  },
});
export const usr = toApi({
  /**更改基本信息 */
  'usr/edit': {
    in: user.editable.partial(),
  },
  /**修改密码 */
  'usr/pwd/edit': {
    in: z.object({ old: pwd, new: pwd }),
  },
  /**发送手机验证码 */
  'usr/phone/otp': {
    meta: { type: 'post', token: '' },
    in: phone,
  },
  /**修改手机号 */
  'usr/phone/edit': {
    in: z.object({ old: phone, new: phone, code }),
  },
  /**发送邮箱验证链接 */
  'usr/email/otp': {
    in: z.string().email(),
  },
  /**添加邮箱 */
  'usr/email/add': {
    in: z.string().email(),
  },
  /**删除邮箱 */
  'usr/email/remove': {
    in: z.string().email(),
  },
  /**退订邮件消息 */
  'usr/email/unsubscribe': {},
});
export const lib = toApi({
  'lib/list': {
    in: param.page.extend({
      filter: filter.data.pick({ rtype: true }).optional(),
    }),
    out: participant.lib.array(),
  },
  'lib/add': {
    in: param.uid.merge(param.rtype),
  },
  'lib/remove': {
    in: param.uid.merge(param.rtype),
  },
  /**推送项目 */
  'lib/push': {
    in: param.pid.merge(param.rtype).extend({
      uids: z.number().array(),
    }),
  },
});
export const notify = toApi({
  'notify/stream': {
    meta: { type: 'ws', token: '' }, // debug only
    out: shared.message,
  },
  'notify/list': {
    in: param.page,
    out: shared.message.array(),
  },
  'notify/read': {
    in: param.uid.extend({ mid: shared.message.shape.mid }),
  },
});
export const ptc = toApi({
  'ptc/list': {
    in: param.page.merge(param.pid).extend({ filter: filter.data.optional() }),
    out: participant.join.array(),
  },
  'ptc/approve': {
    in: param.rtype.merge(param.uid),
  },
  'ptc/reject': {
    in: param.rtype.merge(param.uid),
  },
  /**更改日程 */
  'ptc/event': {
    in: param.uid
      .merge(param.rtype)
      .extend({ starts: shared.timestamp.array() }),
  },
});
export const proj = toApi({
  'proj/public': {
    in: param.pid,
    out: project.public.data,
  },
  'proj/public/sup': {
    in: param.pid,
    out: project.public.supply,
  },
  'proj/public/list': {
    meta: { type: 'post', token: '' },
    in: param.page.extend({
      filter: filter.data.omit({ state: true }).optional(),
    }),
    out: project.public.preview.array(),
  },
  /**公开项目集范围 */
  'proj/public/range': {
    out: filter.range,
  },
  /**用户报名的项目 */
  'proj/joined': {
    in: param.pid,
    out: project.joined.data,
  },
  'proj/joined/sup': {
    in: param.pid,
    out: project.joined.supply,
  },
  'proj/joined/list': {
    in: param.page.extend({
      filter: filter.data.pick({ rtype: true }).optional(),
    }),
    out: project.joined.preview.array(),
  },
  /**用户创建的项目 */
  'proj/own': {
    in: param.pid,
    out: project.own.data,
  },
  'proj/own/sup': {
    in: param.pid,
    out: project.own.supply,
  },
  'proj/own/list': {
    in: param.page.extend({
      filter: filter.data.pick({ rtype: true }).optional(),
    }),
    out: project.own.preview.array(),
  },
  /**新建项目 */
  'proj/add': {
    out: project.own.data,
  },
  'proj/edit': {
    in: project.own.data.omit({ state: true }),
  },
  'proj/publish': {
    in: param.pid,
  },
  'proj/remove': {
    in: param.pid,
  },
  'proj/join': {
    in: param.pid.merge(param.rtype).extend({
      starts: shared.timestamp.array().optional(),
    }),
  },
});
export const rpt = toApi({
  'rpt/proj': {
    in: report.project,
  },
  /**举报用户 */
  'rpt/user': {
    in: report.user,
  },
});
export const sched = toApi({
  /**公开项目日程 */
  'sched/public': {
    in: param.pid.merge(param.rtype),
    out: project.public.schedule.omit({ pid: true, rtype: true }).array(),
  },
  'sched/joined': {
    in: param.pid.merge(param.rtype),
    out: project.joined.schedule.omit({ pid: true, rtype: true }).array(),
  },
  'sched/own': {
    in: param.pid.merge(param.rtype),
    out: project.own.schedule.omit({ pid: true, rtype: true }).array(),
  },
  'sched/joined/all': {
    out: project.joined.schedule.array(),
  },
  'sched/own/all': {
    out: project.own.schedule.array(),
  },
});
const batch = toApi({
  batch: {
    in: z.object({ p: z.string(), d: z.any() }).array().min(2),
    out: shared.output().array().min(2),
  },
});

export const apiConfig = {
  ...account,
  ...usr,
  ...lib,
  ...notify,
  ...ptc,
  ...proj,
  ...rpt,
  ...sched,
  ...batch,
};
export type ApiConfig = typeof apiConfig;
