import { z } from 'zod';
import { each } from '..';
import {
  experiment,
  output,
  param,
  recruitment,
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
type RawApiRecords = { [K in string]: RawApiRecords | Partial<ApiRecord> };

const { phone, pwd } = user.back.shape;
const defaultApiRecord = {
  meta: { type: 'post', token: 'access' },
  in: z.undefined(),
  out: z.undefined(),
} satisfies ApiRecord;

const usr = {
  /**更改基本信息 */
  edit: {
    in: user.front.editable.partial(),
  },
  /**修改密码 */
  'pwd/edit': {
    in: z.object({ old: pwd, new: pwd }),
  },
  /**修改手机号 */
  'phone/edit': {
    in: z.object({ old: phone, new: phone, code: param.code }),
  },
  email: {
    /**添加邮箱 */
    add: {
      in: z.string().email(),
    },
    /**删除邮箱 */
    remove: {
      in: z.string().email(),
    },
    /**退订邮件消息 */
    unsubscribe: {
      meta: { type: 'get', token: '' },
    },
  },
  ptc: {
    list: {
      in: param.page.extend({
        filter: experiment.front.filter.data.pick({ rtype: true }).optional(),
      }),
      out: user_participant.front.array(),
    },
    add: {
      in: param.uid.merge(param.rtype),
    },
    remove: {
      in: param.uid.merge(param.rtype),
    },
  },
} satisfies RawApiRecords;
const recruit = {
  add: {
    in: recruitment.front,
  },
  edit: {
    in: recruitment.front.partial(),
  },
  remove: {
    in: param.rtype,
  },
  ptc: {
    list: {
      in: param.page.merge(param.eid).merge(param.rtype),
      out: recruitment_participant.front.array(),
    },
    approve: {
      in: param.rtype.merge(param.uid),
    },
    reject: {
      in: param.rtype.merge(param.uid),
    },
    /**更改日程 */
    // 'event': {
    //   in: param.uid
    //     .merge(param.rtype)
    //     .extend({ starts: shared.timestamp.array() }),
    // },
  },
} satisfies RawApiRecords;
const exp = {
  recruit,
  add: {
    out: experiment.front.own.data,
  },
  edit: {
    in: experiment.front.own.data.omit({ state: true }),
  },
  remove: {
    in: param.eid,
  },
  publish: {
    in: param.eid,
  },
  join: {
    in: param.eid.merge(param.rtype).extend({
      // starts: shared.timestamp.array().optional(),
    }),
  },
  push: {
    in: param.eid.merge(param.rtype).extend({
      uids: param.uid.shape.uid.array(),
    }),
  },
  /**公开项目 */
  public: {
    '': {
      meta: { type: 'post', token: '' },
      in: param.eid,
      out: experiment.front.public.data,
    },
    sup: {
      meta: { type: 'post', token: '' },
      in: param.eid,
      out: experiment.front.public.supply,
    },
    list: {
      meta: { type: 'post', token: '' },
      in: param.page.extend({
        filter: experiment.front.filter.data.omit({ state: true }).optional(),
      }),
      out: experiment.front.public.preview.array(),
    },
    /**公开项目范围 */
    range: {
      out: experiment.front.filter.range,
    },
  },
  /**用户参与的项目 */
  joined: {
    '': {
      in: param.eid,
      out: experiment.front.joined.data,
    },
    sup: {
      in: param.eid,
      out: experiment.front.joined.supply,
    },
    list: {
      in: param.page.extend({
        filter: experiment.front.filter.data.pick({ rtype: true }).optional(),
      }),
      out: experiment.front.joined.preview.array(),
    },
  },
  /**用户创建的项目 */
  own: {
    '': {
      in: param.eid,
      out: experiment.front.own.data,
    },
    sup: {
      in: param.eid,
      out: experiment.front.own.supply,
    },
    list: {
      in: param.page.extend({
        filter: experiment.front.filter.data.pick({ rtype: true }).optional(),
      }),
      out: experiment.front.own.preview.array(),
    },
  },
} satisfies RawApiRecords;
const msg = {
  stream: {
    meta: { type: 'ws', token: '' }, // debug only
    out: shared.message,
  },
  list: {
    in: param.page,
    out: shared.message.array(),
  },
  read: {
    in: param.uid.extend({ mid: shared.message.shape.mid }),
  },
} satisfies RawApiRecords;
/**举报 */
const rpt = {
  exp: {
    in: report.experiment,
  },
  user: {
    in: report.user,
  },
} satisfies RawApiRecords;
const sched = {
  /**公开项目日程 */
  // 'public': {
  //   in: param.eid.merge(param.rtype),
  //   out: experiment.front.public.schedule
  //     .omit({ eid: true, rtype: true })
  //     .array(),
  // },
  // 'joined': {
  //   in: param.eid.merge(param.rtype),
  //   out: experiment.front.joined.schedule
  //     .omit({ eid: true, rtype: true })
  //     .array(),
  // },
  // 'own': {
  //   in: param.eid.merge(param.rtype),
  //   out: experiment.front.own.schedule.omit({ eid: true, rtype: true }).array(),
  // },
  // 'joined/all': {
  //   out: experiment.front.joined.schedule.array(),
  // },
  // 'own/all': {
  //   out: experiment.front.own.schedule.array(),
  // },
} satisfies RawApiRecords;

type MergeApiRecord<T extends Partial<ApiRecord>> =
  Merge<typeof defaultApiRecord, T> extends infer R extends ApiRecord
    ? Merge<R, { out: Output<R['out']> }>
    : never;
type FlattenToUnion<T extends RawApiRecords, P extends string = ''> = {
  [K in keyof T]: [Lowercase<`${P}/${string & K}`>, T[K]] extends [
    infer K extends string,
    infer V,
  ]
    ? V extends Partial<ApiRecord>
      ? Record<K, MergeApiRecord<V>>
      : V extends RawApiRecords
        ? FlattenToUnion<V, K>
        : Record<K, 'should be object'>
    : never;
}[keyof T];
const toApi = (function () {
  const keys = new Set(Object.keys(defaultApiRecord));
  return <T extends RawApiRecords>(raw: T, root = '') => {
    const records: LooseObject = {};
    each(raw, (v, k) => {
      const path = `${root}/${k}`.toLowerCase();
      const isApiRecord = Object.keys(v).every((k) => keys.has(k));
      if (isApiRecord) {
        const record = Object.assign({}, defaultApiRecord, v);
        records[path] = Object.assign(record, { out: output(record.out) });
      } else {
        Object.assign(records, toApi(v as RawApiRecords, path));
      }
    });
    return records as UnionToIntersection<FlattenToUnion<T>>;
  };
})();
const rawApiRecords = {
  /**注册 */
  signup: {
    meta: { type: 'post', token: '' },
    in: user.back
      .pick({ phone: true, gender: true, birthday: true })
      .extend({ code: param.code }),
  },
  /**注销 */
  signoff: {},
  'token/refresh': {
    meta: { type: 'post', token: 'refresh' },
    out: shared.token,
  },
  batch: {
    in: z.tuple([z.string(), z.any()]).array().min(2),
    out: output().array().min(2),
  },
  login: {
    /**密码登录 */
    pwd: {
      meta: { type: 'post', token: '' },
      in: z.object({ phone, pwd }),
      out: user.front.own.merge(shared.token),
    },
    /**验证码登录 */
    phone: {
      meta: { type: 'post', token: '' },
      in: z.object({ phone, code: param.code }),
      out: user.front.own.merge(shared.token),
    },
    /**token 登录 */
    token: {
      out: user.front.own,
    },
  },
  otp: {
    phone: {
      meta: { type: 'post', token: '' },
      in: phone,
    },
    email: {
      in: z.string().email(),
    },
  },
  usr,
  exp,
  msg,
  rpt,
} satisfies RawApiRecords;
export const apiRecords = toApi(rawApiRecords);
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
