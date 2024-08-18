import { mapValues } from 'lodash-es';
import { z } from 'zod';
import {
  filter,
  param,
  participant,
  project,
  report,
  shared,
  user,
} from './schema';

export type ApiType = 'get' | 'post' | 'sse' | 'ws';
export type ApiMeta = Partial<{ token: keyof Shared.Token | '' }>;
export type ApiRecord<
  Type extends ApiType = ApiType,
  Meta extends ApiMeta = ApiMeta,
  Req extends z.ZodType = z.ZodType,
  Res extends z.ZodType = z.ZodType,
> = { type: Type; meta: Meta; req: Req; res: Res };

const apiDefaultRecord = {
  type: 'post',
  meta: { token: 'access' },
  req: z.null(),
  res: z.null(),
} as const satisfies ApiRecord;
function toApi<const T extends Record<string, Partial<ApiRecord>>>(config: T) {
  return mapValues(config, (v, k) => {
    k.split('/').forEach((part) => {
      if (!/^[a-z]+$/.test(part)) {
        throw new Error(`API 路径不符合规范: ${k}`);
      }
    });
    return Object.assign({}, apiDefaultRecord, v);
  }) as {
    [K in keyof T]: Merge<typeof apiDefaultRecord, T[K]>;
  };
}

export const account = toApi({
  /**密码登录 */
  login: {
    req: z.object({
      data: z.object({ phone: z.number(), pwd: z.string() }),
    }),
    res: user.own.merge(shared.token),
  },
  /**发送登录验证码 */
  'phone/code': {
    req: z.object({ params: z.object({ phone: z.number() }) }),
  },
  /**验证码登录 */
  'login/otp': {
    req: z.object({
      params: z.object({ phone: z.number(), code: z.number() }),
    }),
    res: user.own.merge(shared.token),
  },
  /**token登录 */
  'login/token': {
    res: user.own,
  },
  /**退出登录 */
  logout: {},
  /**实名认证 */
  'auth/realname': {
    req: z.object({ data: user.auth }),
  },
  /**招募者认证: 有绑定教育邮箱才能认证 */
  'auth/recruiter': {
    req: z.object({ data: z.null() }),
  },
  'token/refresh': {
    meta: { token: 'refresh' },
    res: shared.token,
  },
});
export const lib = toApi({
  'lib/list': {
    type: 'get',
    req: param.page.extend({
      filter: filter.data.pick({ rtype: true }).optional(),
    }),
    res: participant.lib.array(),
  },
  'lib/add': {
    req: param.uid.merge(param.rtype),
  },
  'lib/remove': {
    req: param.uid.merge(param.rtype),
  },
  /**推送项目 */
  'lib/push': {
    req: param.pid.merge(param.rtype).extend({
      uids: z.number().array(),
    }),
  },
});
export const notify = toApi({
  'notify/stream': {
    type: 'ws',
    res: shared.message,
  },
  'notify/list': {
    type: 'get',
    req: param.page,
    res: shared.message.array(),
  },
  'notify/read': {
    req: param.uid.extend({ mid: shared.message.shape.mid }),
  },
});
export const ptc = toApi({
  'ptc/list': {
    req: param.page.extend({ filter: filter.data.optional() }).merge(param.pid),
    res: participant.join.array(),
  },
  'ptc/approve': {
    req: param.rtype.merge(param.uid),
  },
  'ptc/reject': {
    req: param.rtype.merge(param.uid),
  },
  /**更改日程 */
  'ptc/event': {
    req: param.uid.merge(param.rtype).extend({
      starts: shared.timestamp.array(),
    }),
  },
});
export const proj = toApi({
  'proj/public': {
    req: param.pid,
    res: project.public.data,
  },
  'proj/public/sup': {
    req: param.pid,
    res: project.public.supply,
  },
  'proj/public/list': {
    type: 'get',
    meta: { token: '' },
    req: param.page.extend({
      filter: filter.data.omit({ state: true }).optional(),
    }),
    res: project.public.preview.array(),
  },
  /**公开项目集范围 */
  'proj/public/range': {
    res: filter.range,
  },
  /**用户报名的项目 */
  'proj/joined': {
    req: param.pid,
    res: project.joined.data,
  },
  'proj/joined/sup': {
    req: param.pid,
    res: project.joined.supply,
  },
  'proj/joined/list': {
    type: 'get',
    req: param.page.extend({
      filter: filter.data.pick({ rtype: true }).optional(),
    }),
    res: project.joined.preview.array(),
  },
  /**用户创建的项目 */
  'proj/own': {
    req: param.pid,
    res: project.own.data,
  },
  'proj/own/sup': {
    req: param.pid,
    res: project.own.supply,
  },
  'proj/own/list': {
    type: 'get',
    req: param.page.extend({
      filter: filter.data.pick({ rtype: true }).optional(),
    }),
    res: project.own.preview.array(),
  },
  /**新建项目 */
  'proj/add': {
    res: project.own.data,
  },
  'proj/edit': {
    req: project.own.data.omit({ state: true }),
  },
  'proj/publish': {
    req: param.pid,
  },
  'proj/remove': {
    req: param.pid,
  },
  'proj/join': {
    req: param.pid.merge(param.rtype).extend({
      starts: shared.timestamp.array().optional(),
    }),
  },
});
export const rpt = toApi({
  'rpt/proj': {
    req: report.project,
  },
  /**举报用户 */
  'rpt/user': {
    req: report.user,
  },
});
export const sched = toApi({
  /**公开项目日程 */
  'sched/public': {
    req: param.pid.merge(param.rtype),
    res: project.public.schedule.omit({ pid: true, rtype: true }).array(),
  },
  'sched/joined': {
    req: param.pid.merge(param.rtype),
    res: project.joined.schedule.omit({ pid: true, rtype: true }).array(),
  },
  'sched/own': {
    req: param.pid.merge(param.rtype),
    res: project.own.schedule.omit({ pid: true, rtype: true }).array(),
  },
  'sched/joined/all': {
    res: project.joined.schedule.array(),
  },
  'sched/own/all': {
    res: project.own.schedule.array(),
  },
});
export const usr = toApi({
  'usr/del': {},
  /**更改基本信息 */
  'usr/edit': {
    req: user.editable.partial(),
  },
  /**获取所有可用的用户头像 */
  'usr/face/list': {
    type: 'get',
    meta: { token: '' },
    res: z.string().array(),
  },
  /**用户账号是否有密码 */
  'usr/pwd/has': {
    res: z.boolean(),
  },
  /**添加密码 */
  'usr/pwd/add': {
    req: z.string(),
  },
  /**修改密码 */
  'usr/pwd/edit': {
    req: z.object({ old: z.string(), new: z.string() }),
  },
  /**向新手机号发送验证码 */
  'usr/phone/send': {
    req: user.own.shape.phone,
  },
  /**修改手机号 */
  'usr/phone/edit': {
    req: z.object({
      old: user.own.shape.phone,
      new: user.own.shape.phone,
      code: z.string().length(6),
    }),
  },
  /**添加邮箱，向邮箱发送验证链接 */
  'usr/email/add': {
    req: z.string().email(),
  },
  /**删除邮箱，向邮箱发送验证链接 */
  'usr/email/remove': {
    req: z.string().email(),
  },
  /**退订邮件消息 */
  'usr/email/unsubscribe': {
    type: 'get',
  },
});

const apiConfig = {
  ...account,
  ...lib,
  ...notify,
  ...ptc,
  ...proj,
  ...rpt,
  ...sched,
  ...usr,
};
export type ApiConfig = typeof apiConfig;
export default apiConfig;
