import { Document } from 'mongoose';
import { omit } from 'shared';
import { BizCode } from 'shared/data';

/**create success output */
export function o<T>(
  type: 'succ',
  data: T,
): Extract<Shared.Output<T>, { code: 0 }>;
/**create failure output */
export function o(
  type: 'fail',
  msg: string,
): Extract<Shared.Output, { code: 1 }>;
/**convert Document to plain object */
export function o<T extends {}>(data: Document<unknown, {}, T>): T;
/**check output's type */
export function o<T extends Shared.Output>(data: T): T;
export function o(...args: any[]) {
  if (args.length === 1) {
    const data = args[0];
    return data instanceof Document
      ? omit(data.toObject({ minimize: false }), ['_id', '__v'])
      : data;
  }
  const [type, content] = args;
  if (type === 'succ')
    return { code: BizCode.Success.value, msg: '', data: o(content) };
  if (type === 'fail') return { code: BizCode.Fail.value, msg: o(content) };
  throw 'unknown type';
}
