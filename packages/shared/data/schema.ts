import { z } from 'zod'; /**@see https://zod.dev/ */
import { difference, mapValues } from '..';
import {
  ExperimentState,
  ExperimentType,
  FeedbackType,
  Gender,
  MessageType,
  OutputCode,
  RecruitmentType,
  ReportType,
  type EnumMeta,
} from './enum';

declare module 'zod' {
  type Meta = Partial<{
    // sql
    primaryKey: true;
    unique: true;
    references: `${string}.${string}`;
    // form
    text: string;
    desc: string;
    items: Partial<{
      text: string;
      name: string;
      value: number;
    }>[];
    type: 'date' | 'textarea' | 'range';
  }>;
  interface ZodType {
    readonly metadata?: Meta;
    meta: (data: Meta) => this;
  }
}
Object.defineProperties(z.ZodType.prototype, {
  /**@see https://github.com/colinhacks/zod/blob/main/src/types.ts#L179 */
  metadata: {
    get() {
      return this._def.meta;
    },
  },
  /**@see https://github.com/colinhacks/zod/blob/main/src/types.ts#L556 */
  meta: {
    value(data: NonNullable<z.ZodType['metadata']>) {
      const This = (this as any).constructor;
      return new This({
        ...this._def,
        meta: Object.assign(this.metadata ?? {}, data),
      });
    },
  },
});

function enums<const T extends number>(
  obj: PartialByKey<EnumMeta<T[]>, 'items'>,
  isStr?: true,
) {
  type Enum = UnionToTuple<T extends number ? z.ZodLiteral<T> : never>;
  return (
    z
      //@ts-ignore
      .union<Enum>(
        obj.enums.flatMap((v) =>
          isStr ? [z.literal(v), z.literal('' + v)] : z.literal(v),
        ),
        { message: `枚举值无效: ${obj.enums}` },
      )
      .meta({ items: obj.items })
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

// 参数验证
export const posInt = z
  .number()
  .int()
  .min(1)
  .max(2 ** 31 - 1);
export const max20Str = z.string().max(20);
export const max100Str = z.string().max(100);
export const uuid = z.string().uuid();
export const param = {
  uid: z.object({ uid: uuid }),
  eid: z.object({ eid: uuid }),
  rid: z.object({ rid: uuid }),
  rcid: z.object({ rcid: uuid }),
  page: z.object({ pn: posInt, ps: posInt }),
  /**招募类型、参与者类型 */
  rtype: z.object({
    rtype: enums(RecruitmentType).meta({ text: '招募类型' }),
  }),
  code: z.string().length(6, '验证码长度应为 6 位').meta({ text: '验证码' }),
};
export const shared = (function () {
  /**时间戳, 单位s */
  const timestamp = posInt.brand<'timestamp'>().meta({ type: 'date' });
  /**持续时间, 单位min */
  const duration = posInt.brand<'duration'>();
  const position = z.object({
    detail: z.string().max(30),
  });
  const token = z.object({
    access: z.string(),
    refresh: z.string(),
  });
  return { timestamp, duration, position, token };
})();

export const user = (function () {
  const editable = z.object({
    name: max20Str.meta({ text: '昵称' }),
    face: z.string().url().meta({ text: '头像' }), // 存在安全隐患
  });
  const _public = editable.extend({
    uid: uuid.meta({ primaryKey: true }),
    gender: enums(Gender).meta({ text: '性别' }),
    birthday: shared.timestamp.meta({ text: '生日' }),
  });
  const own = _public.extend({
    phone: z
      .string()
      .length(11, '手机号长度为 11 位')
      .regex(/^1[3-9]\d{9}$/, '手机号格式错误')
      .meta({ unique: true, text: '手机号' }),
    emails: z.string().email().array().meta({ text: '邮箱' }),
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
        .regex(
          /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*()_+={}\[\]:;"'<>?,./~`-]).{8,}$/,
          '至少 8 位，需要包含 1 个大写字母、1 个小写字母、1 个数字、1 个特殊字符',
        )
        .meta({ text: '密码' }),
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
  back: param.rtype.extend({
    uid: uuid.meta({ references: 'user.uid' }),
    /**参与者 uid */
    puid: uuid.meta({ references: 'user.uid' }),
  }),
};

/**招募的参与者 */
export const recruitment_participant = {
  front: user.front.public,
  back: z.object({
    uid: uuid.meta({ references: 'user.uid' }),
    rcid: uuid.meta({ references: 'recruitment_condition.rcid' }),
  }),
};
export const recruitment_condition = (function () {
  const base = z.object({ size: posInt }); /* .merge(user_filter) */
  return {
    front: base,
    back: base.extend({
      rcid: uuid.meta({ primaryKey: true }),
      rid: uuid.meta({ references: 'recruitment.rid' }),
    }),
  };
})();
export const recruitment = (function () {
  const base = param.rtype.extend({
    fee: posInt.max(1e3),
    notice: max100Str.meta({ type: 'textarea' }),
    durations: shared.duration
      .refine((v) => v <= 1440, { message: '单次时长不能超过 1440 分钟' })
      .array()
      .min(1),
    // max_concurrency: posInt,
    // should_select_event: z.boolean(),
  });
  return {
    front: base,
    back: base.extend({
      rid: uuid.meta({ primaryKey: true }),
      eid: uuid.meta({ references: 'experiment.eid' }),
    }),
  };
})();
export const experiment = (function () {
  const _public = (function () {
    const preview = z.object({
      eid: uuid.meta({ primaryKey: true }),
      type: enums(ExperimentType).meta({ text: '实验类型' }),
      title: max20Str.min(1).meta({ text: '实验名称' }),
      position: shared.position.meta({ text: '实验室位置' }),
    });
    const supply = z.object({
      uid: uuid.meta({ references: 'user.uid' }),
      notice: max100Str.meta({ type: 'textarea', text: '实验须知' }),
      // events: z.tuple([shared.timestamp, shared.timestamp]).array().min(1),
    });
    const data = preview.merge(supply);
    // const schedule = param.rtype.extend({
    //   eid: uuid.meta({ references: 'experiment.eid' }),
    //   start: shared.timestamp,
    //   end: shared.timestamp,
    // });
    return { preview, supply, data };
  })();
  const joined = (function () {
    const preview = _public.preview;
    const data = _public.data;
    const supply = diff(data, preview);
    // const schedule = _public.schedule;
    return { preview, supply, data };
  })();
  const own = (function () {
    const preview = _public.data
      .extend({ state: enums(ExperimentState) })
      .omit({ position: true });
    const data = _public.data.extend({ state: enums(ExperimentState) });
    const supply = diff(data, preview);
    // const schedule = joined.schedule.extend({ uids: posInt.array() });
    return { preview, supply, data };
  })();
  const filter = (function () {
    const times = posInt.max(100);
    const range = z.object({
      duration_range: z
        .tuple([shared.duration, shared.duration])
        .meta({ type: 'range', text: '实验总时长', desc: '单位：min' }),
      times_range: z
        .tuple([times, times])
        .meta({ type: 'range', text: '参加次数' }),
      fee_range: z
        .tuple([recruitment.front.shape.fee, recruitment.front.shape.fee])
        .meta({ type: 'range', text: '实验报酬', desc: '单位：￥' }),
    });
    return {
      range,
      data: range
        .merge(own.data.pick({ type: true, state: true }))
        .extend({
          search: max20Str.meta({ text: '搜索文本' }),
          // command: z.string().meta({form:{ text: '搜索指令' }}),
        })
        .partial()
        .merge(param.rtype),
    };
  })();
  return {
    front: { public: _public, joined, own, filter },
    back: own.data.extend({ created_at: shared.timestamp }),
  };
})();
export type ExperimentFrontDataType = Exclude<
  keyof typeof experiment.front,
  'filter'
>;
export const message = (function () {
  const front = z.object({
    mid: uuid.meta({ primaryKey: true }),
    type: enums(MessageType),
    title: max20Str,
    content: max100Str,
    created_at: shared.timestamp,
  });
  return {
    front: front.extend({
      has_read: z.boolean(),
    }),
    back: front.extend({
      uid: uuid.meta({ references: 'user.uid' }),
    }),
  };
})();
/**每行表示 uid 已读 mid */
export const message_read = {
  back: z.object({
    mid: uuid.meta({ references: 'message.mid' }),
    uid: uuid.meta({ references: 'user.uid' }),
  }),
};
export const report = (function () {
  const front = z.object({
    /**被举报对象 id */
    id: uuid,
    type: enums(ReportType),
    content: max100Str,
  });
  return {
    front,
    back: front.extend({
      uid: uuid.meta({ references: 'user.uid' }),
    }),
  };
})();
export const feedback = (function () {
  const front = z.object({
    type: enums(FeedbackType),
    content: max100Str,
  });
  return {
    front,
    back: front.extend({
      uid: uuid.meta({ references: 'user.uid' }),
    }),
  };
})();

export const tables = {
  user,
  user_participant,
  experiment,
  recruitment,
  recruitment_condition,
  recruitment_participant,
  message,
  message_read,
  report,
  feedback,
} satisfies Record<string, { front?: {}; back: z.ZodType }>;
