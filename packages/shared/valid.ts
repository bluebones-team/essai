import { each } from 'lodash-es';
import { z } from 'zod';

type RuleInfo = Record<string, (...args: any[]) => [z.ZodType, string]>;
type RuleGenerator<T extends RuleInfo> = {
  [K in keyof T]: (...args: Parameters<T[K]>) => RuleGenerator<T>;
} & {
  /**验证函数数组 */
  c: ((value: unknown) => string | true)[];
};
const zstr = z.string();
const znum = z.number();
function createRuleGenerator<T extends RuleInfo>(obj: T) {
  const generator = { c: [] } as RuleGenerator<T>;
  each(obj, (info, name) => {
    //@ts-ignore
    generator[name] = function (...args: Parameters<typeof info>) {
      const [schema, message] = info(...args);
      this.c.push(
        (value: unknown) => schema.safeParse(value).success || message,
      );
      return this;
    };
  });
  return generator;
}
export const r = {
  str: () =>
    createRuleGenerator({
      type: () => [zstr, '应为字符串'],
      name: () => [
        zstr.regex(/^[\u4e00-\u9fa5_a-zA-Z0-9]+$/),
        '只能包含中英文、数字、下划线',
      ],
      content: () => [zstr.regex(/^[^\<\/\>\'\";"']*$/), '不能包含</>\'";'],
      in: (array: [string, ...string[]]) => [z.enum(array), '错误的枚举值'],
      min: (length: number) => [zstr.min(length), '字数不少于' + length],
      max: (length: number) => [zstr.max(length), '字数不多于' + length],
      email: () => [zstr.email(), '邮箱格式错误'],
      eduEmail: () => [
        zstr.email().regex(/(edu.cn|edu.com|ac.cn)$/),
        '教育邮箱后缀应为: edu.cn、edu.com、ac.cn',
      ],
      pwd: () => [
        zstr.regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,20}$/),
        '密码必须包含至少一个大写字母、一个小写字母、一个数字、并且长度在8到20之间',
      ],
    }).type(),
  num: () =>
    createRuleGenerator({
      type: () => [znum, '应为数字'],
      int: () => [znum.int(), '应为整数'],
      phone: () => [
        znum.refine((e) => (e + '').length === 11),
        '只能为11位手机号',
      ],
      min: (length: number) => [znum.min(length), '至少为' + length],
      max: (length: number) => [znum.max(length), '不超过' + length],
    }).type(),
  date: () =>
    createRuleGenerator({
      type: () => [zstr.refine((v) => !isNaN(+new Date(v))), '应为日期格式'],
    }).type(),
};
