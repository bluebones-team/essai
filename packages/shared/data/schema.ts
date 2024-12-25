import { z } from 'zod'; /**@see https://zod.dev/ */
import { difference, mapValues } from '..';
import {
  ExperimentState,
  ExperimentType,
  Gender,
  JoinState,
  MessageType,
  OutputCode,
  RecruitmentType,
  ReportProjectType,
  ReportUserType,
  type EnumMeta,
} from './enum';

function enums<const T extends number>(
  obj: Pick<EnumMeta<T[]>, 'enums'>,
  isStr?: true,
) {
  type Enum = UnionToTuple<T extends number ? z.ZodLiteral<T> : never>;
  //@ts-ignore
  return z.union<Enum>(
    obj.enums.flatMap((v) =>
      isStr ? [z.literal(v), z.literal('' + v)] : z.literal(v),
    ),
    { message: `枚举值无效: ${obj.enums}` },
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
  eid: z.object({ eid: posInt }),
  /**招募类型、参与者类型 */
  rtype: z.object({ rtype: enums(RecruitmentType) }),
};
//@ts-ignore
export function output<T extends z.ZodType = z.ZodAny>(data: T = z.any()) {
  const dataEnums = [OutputCode.Success.value];
  return z.union([
    z.object({
      code: enums({ enums: dataEnums }),
      msg: z.string(),
      data,
    }),
    z.object({
      code: enums({ enums: difference(OutputCode.enums, dataEnums) }),
      msg: z.string(),
    }),
  ]);
}
export type Output<T = any> = ReturnType<
  typeof output<T extends z.ZodType ? T : z.ZodType<T>>
>;
export type ExtractOutput<
  T extends { code: OutputCode },
  U extends OutputCode,
> = T extends { code: infer C } ? (U extends C ? T : never) : never;

export const shared = (function () {
  /**时间戳, 单位s */
  const timestamp = posInt.min(0).brand<'timestamp'>();
  /**持续时间, 单位min */
  const duration = posInt
    .min(0)
    .max(2 * 60)
    .brand<'duration'>();
  const message = param.uid.extend({
    mid: posInt,
    type: enums(MessageType),
    title: max20Str,
    content: max100Str,
    /**创建时间 */
    t: timestamp,
    read: z.boolean(),
  });
  const position = z.object({
    detail: z.string().max(30),
  });
  const token = z.object({
    access: z.string(),
    refresh: z.string(),
  });
  return { timestamp, duration, message, position, token };
})();

export const user = (function () {
  const editable = z.object({
    name: max20Str,
    face: z.string().url(), // 存在安全隐患
  });
  const _public = param.uid.merge(editable).extend({
    gender: enums(Gender),
    birthday: shared.timestamp,
  });
  const own = _public.extend({
    phone: z.string().length(11, '手机号长度为 11 位'),
    emails: z.string().email().array(),
    recruiter: z.boolean(),
    pwd: z.boolean(),
  });
  const filter = z.object({
    gender_range: z.tuple([enums(Gender), enums(Gender)]),
    birthday_range: z.tuple([shared.timestamp, shared.timestamp]),
  });
  return {
    front: { public: _public, own, filter, editable },
    back: own.extend({
      pwd: z
        .string()
        .regex(/^\w{6,16}$/, '密码长度为 6-16 位，只能包含字母、数字或下划线')
        .optional(),
      created_at: shared.timestamp,
    }),
    // realname: z.object({
    //   name: max20Str,
    //   type: enums(CardType),
    //   num: z.string().max(30),
    // }),
  };
})();
/**用户收集的参与者 */
export const user_participant = {
  front: user.front.public.merge(param.rtype),
  back: param.uid.merge(param.rtype).extend({
    /**参与者 uid */
    puid: posInt,
  }),
};

export const recruitment_condition = (function () {
  const base = z.object({ size: posInt }); /* .merge(user_filter) */
  return {
    front: base.extend({ current: posInt }),
    back: base.extend({ rcid: posInt, rid: posInt }),
  };
})();
/**招募的参与者 */
export const recruitment_participant = {
  front: user.front.public
    .merge(param.rtype)
    .extend({ state: enums(JoinState) }),
  back: param.uid.extend({ rcid: posInt, state: enums(JoinState) }),
};
export const recruitment = (function () {
  const back = param.eid.merge(param.rtype).extend({
    rid: posInt,
    fee: posInt.max(1e3),
    notice: max100Str,
    durations: shared.duration.array().min(1),
    // max_concurrency: posInt,
    // should_select_event: z.boolean(),
  });
  return {
    front: back.extend({
      conditions: recruitment_condition.front.array().min(1),
    }),
    back,
  };
})();
export const experiment = (function () {
  const _public = (function () {
    const preview = param.eid.extend({
      type: enums(ExperimentType),
      title: max20Str,
      position: shared.position,
      recruitments: recruitment.front.array(),
    });
    const supply = param.uid.extend({
      notice: max100Str,
      // events: z.tuple([shared.timestamp, shared.timestamp]).array().min(1),
    });
    const data = preview.merge(supply);
    const schedule = param.eid.merge(param.rtype).extend({
      start: shared.timestamp,
      end: shared.timestamp,
    });
    return { preview, supply, data };
  })();
  const joined = (function () {
    const preview = _public.preview.omit({ recruitments: true });
    const data = _public.data;
    const supply = diff(data, preview);
    // const schedule = _public.schedule;
    return { preview, supply, data };
  })();
  const own = (function () {
    const preview = param.eid.extend({
      type: enums(ExperimentType),
      title: max20Str,
      state: enums(ExperimentState),
    });
    const data = _public.data.extend({ state: enums(ExperimentState) });
    const supply = diff(data, preview);
    // const schedule = joined.schedule.extend({ uids: posInt.array() });
    return { preview, supply, data };
  })();
  const filter = (function () {
    const range = z.object({
      duration_range: z.tuple([shared.duration, shared.duration]),
      times_range: z.tuple([posInt, posInt]),
      fee_range: z.tuple([
        recruitment.front.shape.fee,
        recruitment.front.shape.fee,
      ]),
    });
    return {
      range,
      data: range
        .merge(param.rtype)
        .extend({
          type: enums(ExperimentType),
          state: enums(ExperimentState),
          search: max20Str,
          /**搜索指令 */
          // command: z.string(),
        })
        .partial(),
    };
  })();
  return {
    front: { public: _public, joined, own, filter },
    back: own.data.omit({ recruitments: true }).extend({
      created_at: shared.timestamp,
    }),
  };
})();
export type ExperimentDataType = 'public' | 'joined' | 'own';
/**举报 */
export const report = {
  experiment: param.eid.extend({
    type: enums(ReportProjectType),
    content: max100Str,
  }),
  user: param.uid.extend({
    type: enums(ReportUserType),
    content: max100Str,
  }),
};

export const tables = {
  user,
  user_participant,
  experiment,
  recruitment,
  recruitment_condition,
  recruitment_participant,
} satisfies Record<string, { front: {}; back: z.ZodType }>;
