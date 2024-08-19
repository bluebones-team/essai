import { mapValues } from 'lodash-es';
import { z } from 'zod';
import {
  BizCode,
  CardType,
  Gender,
  MessageType,
  ProjectState,
  ProjectType,
  RecruitmentType,
  RptProjectType,
  RptUserType,
} from './enum';

function enums<const T extends number>(d: { _enums: T[] }, isStr?: true) {
  const values = d._enums;
  // const set = new Set<number>(values);
  // return z.number().superRefine((v, ctx): v is T => {
  //   if (!set.has(v)) {
  //     ctx.addIssue({
  //       code: z.ZodIssueCode.invalid_enum_value,
  //       received: v,
  //       options: [...values],
  //     });
  //   }
  //   return z.NEVER;
  // });
  type Enum = UnionToTuple<T extends number ? z.ZodLiteral<T> : never>;
  //@ts-ignore
  return z.union<Enum>(
    values.flatMap((v) =>
      isStr ? [z.literal(v), z.literal('' + v)] : z.literal(v),
    ),
  );
}
function diff<const U extends {}, const T extends U>(
  target: z.ZodObject<T>,
  source: z.ZodObject<U>,
) {
  //@ts-ignore
  return target.omit<{ [k in keyof U]: true }>(
    mapValues(source.shape, (v, k) => true),
  );
}

// 参数验证
const posInt = z.number().int().min(1);
const max20Str = z.string().max(20);
const max100Str = z.string().max(100);
export const param = {
  page: z.object({ pn: posInt, ps: posInt }),
  uid: z.object({ uid: posInt }),
  pid: z.object({ pid: posInt }),
  /**招募类型、参与者类型 */
  rtype: z.object({ rtype: enums(RecruitmentType) }),
};

export const shared = (function () {
  const st = Math.floor(new Date().setHours(0) / 1e3);
  /**时间戳, 单位s */
  const timestamp = posInt.min(st).max(st + 28 * 24 * 3600); //debug
  /**持续时间, 单位min */
  const duration = posInt.min(0).max(2 * 60);
  /**消息 */
  const message = param.uid.extend({
    mid: posInt,
    type: enums(MessageType),
    title: max20Str,
    content: max100Str,
    /**创建时间 */
    t: timestamp,
    has_read: z.boolean(),
  });
  const position = z.object({
    detail: z.string().max(30),
  });
  const token = z.object({
    access: max100Str,
    refresh: max100Str,
  });
  //@ts-ignore
  const output = <T extends z.ZodType = z.ZodAny>(data?: T = z.any()) =>
    z.object({ code: enums(BizCode), msg: max20Str, data });
  return { timestamp, duration, message, position, token, output };
})();
export const project = (function () {
  const participantCondition = z.object({
    gender: enums(Gender).optional(),
    birthday_range: z.tuple([shared.timestamp, shared.timestamp]).optional(),
  });
  const recruitmentContent = z.object({
    // condition: participantCondition,
    total: posInt.max(1e3),
    cur: posInt.max(1e3),
  });
  const recruitment = param.rtype.extend({
    fee: posInt.max(1e3),
    should_select_event: z.boolean(),
    durations: shared.duration.array().max(4).min(1),
    tip: z.string(),
    max_concurrency: posInt,
    contents: recruitmentContent.array().min(1),
  });
  const _public = (function () {
    const preview = param.pid.extend({
      type: enums(ProjectType),
      title: max20Str,
      position: shared.position,
      recruitments: recruitment.array(),
    });
    const supply = param.uid.extend({
      desc: max100Str,
      /**知情同意书 */
      // consent: max100Str,
      events: z.tuple([shared.timestamp, shared.timestamp]).array().min(1),
    });
    const data = preview.merge(supply);
    const schedule = param.pid.merge(param.rtype).extend({
      start: shared.timestamp,
      end: shared.timestamp,
    });
    return { preview, supply, data, schedule };
  })();
  const joined = (function () {
    const preview = _public.preview.omit({ recruitments: true });
    const data = _public.data;
    const supply = diff(data, preview);
    const schedule = _public.schedule;
    return { preview, supply, data, schedule };
  })();
  const own = (function () {
    const preview = param.pid.extend({
      type: enums(ProjectType),
      title: max20Str,
      state: enums(ProjectState),
    });
    const data = _public.data.extend({ state: enums(ProjectState) });
    const supply = diff(data, preview);
    const schedule = joined.schedule.extend({ uids: posInt.array() });
    return { preview, supply, data, schedule };
  })();
  return { recruitment, public: _public, joined, own };
})();
/**项目筛选器 */
export const filter = (function () {
  const range = z.object({
    duration_range: z.tuple([shared.duration, shared.duration]),
    times_range: z.tuple([posInt.max(10), posInt.max(10)]),
    fee_range: z.tuple([
      project.recruitment.shape.fee,
      project.recruitment.shape.fee,
    ]),
  });
  const data = range
    .merge(param.rtype)
    .extend({
      type: enums(ProjectType),
      state: enums(ProjectState),
      search: max20Str,
      /**搜索指令 */
      // command: z.string(),
    })
    .partial();
  return { range, data };
})();

export const user = (function () {
  const _public = param.uid.extend({
    name: max20Str,
    face:
      z.string().url() &&
      z.string().startsWith('https://picsum.photos/1?t=').max(30),
    gender: enums(Gender),
    birthday: shared.timestamp,
  });
  const editable = z.object({
    name: max20Str,
    face: z.string().url(),
  });
  const own = _public.extend({
    phone: posInt.min(1e10).lt(1e11),
    emails: z.string().email().array(),
    auth: z.object({
      /**实名信息：特** *****5 */
      realname: z.string().optional(),
      /**认证邮箱 */
      recruiter: z.string().email().optional(),
    }),
  });
  const auth = z.object({
    name: max20Str,
    type: enums(CardType),
    num: z.string().max(30),
  });
  return { public: _public, editable, own, auth };
})();
/**举报 */
export const report = (function () {
  const project = param.pid.extend({
    type: enums(RptProjectType),
    content: max100Str,
  });
  const user = param.uid.extend({
    type: enums(RptUserType),
    content: max100Str,
  });
  return { project, user };
})();
/**参与者 */
export const participant = (function () {
  const join = user.public.merge(param.rtype).extend({
    // events: z.any().array(),
  });
  const lib = user.public.extend({
    rtypes: enums(RecruitmentType).array(),
  });
  return { join, lib };
})();
