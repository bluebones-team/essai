import type { IncomingMessage, ServerResponse } from 'http';
import pino from 'pino';
import type { PrettyOptions } from 'pino-pretty';
import { each, env } from 'shared';
import { OutputCode, type ExtractOutput, type Output } from 'shared/data';
import WebSocket from 'ws';
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
