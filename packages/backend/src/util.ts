import { OutputCode, type ExtractOutput, type Output } from 'shared/data';
import type { z } from 'zod';

/**create success output */
export function o<T extends any = undefined>(
  type: 'succ',
  data?: T,
): ExtractOutput<z.infer<Output<T>>, 0>;
/**create failure output */
export function o(type: 'fail', msg: string): ExtractOutput<z.infer<Output>, 1>;
/**create output by code */
export function o<T extends OutputCode>(
  code: T,
): ExtractOutput<z.infer<Output>, T>;
/**check output's type */
export function o<T extends z.infer<Output>>(data: T): T;
export function o(...[p0, p1]: any[]) {
  if (typeof p0 === 'object') return p0;
  //@ts-ignore
  if (typeof p0 === 'number') return { code: p0, msg: OutputCode[p0].msg };
  if (p0 === 'succ')
    return { code: OutputCode.Success.value, msg: '', data: p1 };
  if (p0 === 'fail') return { code: OutputCode.Fail.value, msg: p1 };
  throw new Error('Invalid output arguments');
}
