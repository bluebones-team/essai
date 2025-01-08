import type { IncomingMessage, ServerResponse } from 'http';
import pino from 'pino';
import type { PrettyOptions } from 'pino-pretty';
import { each, env } from 'shared';
import { OutputCode, type ExtractOutput, type Output } from 'shared/data';
import WebSocket from 'ws';
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
    error: (reason: string, key: string, value: unknown) => {
      log.error({ key, value, reason }, 'DB error');
      return o(OutputCode.DBError.value);
    },
  },
);

export const createContext = {
  base(req: IncomingMessage): BaseContext {
    return {
      req,
      path: req.url ?? 'no path',
      input: null,
      output: null,
    };
  },
  http: (function () {
    const base: Pick<HttpContext, 'set' | 'send'> = {
      set(headers) {
        each(headers, (v, k) => v !== void 0 && this.res.setHeader(k, v));
      },
      send(code, data) {
        this.res.statusCode = code;
        this.res.end(data);
      },
    };
    return async (req: IncomingMessage, res: ServerResponse) =>
      Object.assign(createContext.base(req), base, {
        res,
        input: await new Promise<string>((resolve) => {
          let data = '';
          req
            .on('data', (chunk) => (data += chunk))
            .on('end', () => resolve(data));
        }),
      }) satisfies HttpContext;
  })(),
  ws: (ws: WebSocket, req: IncomingMessage, data: WebSocket.RawData) =>
    Object.assign(createContext.base(req), {
      ws,
      input: data.toString(),
    }) satisfies WsContext,
};
export const isWsContext = (ctx: BaseContext): ctx is WsContext => 'ws' in ctx;

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
          messageFormat: ['{req.method} {req.url}', '{msg}'].join(' - '),
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
