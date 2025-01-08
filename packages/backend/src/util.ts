import pino from 'pino';
import type { PrettyOptions } from 'pino-pretty';
import { env, pick } from 'shared';
import { OutputCode, type ExtractOutput, type Output } from 'shared/data';
import type { z } from 'zod';

/**响应数据构造器 */
export const o = Object.assign(
  ((e: unknown) =>
    //@ts-ignore
    typeof e === 'number' ? { code: e, msg: OutputCode[e].msg } : e) as {
    <T extends z.infer<Output>>(data: T): T;
    <T extends OutputCode>(code: T): ExtractOutput<z.infer<Output>, T>;
  },
  {
    //@ts-ignore
    is: <T>(data: T): data is z.infer<Output> =>
      Object.prototype.hasOwnProperty.call(data, 'code') &&
      Object.prototype.hasOwnProperty.call(data, 'msg'),
    succ: <T extends any = undefined>(data?: T) => ({
      code: OutputCode.Success.value,
      msg: '',
      data: data as T,
    }),
    fail: (msg: string) => ({ code: OutputCode.Fail.value, msg }),
    error: (reason: string, obj: unknown) => {
      console.error(reason, obj);
      obj =
        obj instanceof Error
          ? pick(obj, ['name', 'message', 'stack', 'cause'])
          : obj;
      log.error({ obj, reason }, reason);
      return o(OutputCode.ServerError.value);
    },
  },
);
export const log = pino({
  level: env('NODE_ENV') === 'development' ? 'debug' : 'info',
  transport: {
    targets: [
      {
        target: 'pino-pretty',
        level: 'debug',
        /**@see https://github.com/pinojs/pino-pretty */
        options: {
          translateTime: 'SYS:standard',
          messageFormat: '{msg} - {req.method} {req.url} {res.output.msg}',
          // singleLine: true,
          hideObject: true,
        } satisfies PrettyOptions,
      },
      {
        target: 'pino/file',
        level: 'error',
        options: {
          destination: 'logs/error.log',
          mkdir: true,
        },
      },
      {
        target: 'pino/file',
        level: 'info',
        options: {
          destination: 'logs/info.log',
          mkdir: true,
        },
      },
    ],
  },
});
