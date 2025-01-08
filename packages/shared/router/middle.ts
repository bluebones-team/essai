import type { z } from 'zod';
import { Client, Server, type ApiRecord } from '.';
import { type Middle } from '..';
import { OutputCode, type Output } from '../data';

export const json_encoder = Object.assign(
  function <K extends string>(key: K): Middle<{ [P in K]: any }> {
    return function json_encode(ctx, next) {
      ctx[key] = json_encoder.convert(ctx[key]);
      return next();
    };
  },
  {
    convert(data: any) {
      return data === void 0
        ? ''
        : JSON.stringify(data, function (key, value) {
            if (typeof value === 'bigint') return value + 'n';
            return value;
          });
    },
  },
);
export const json_decoder = Object.assign(
  function <K extends string>(key: K): Middle<{ [P in K]: any }> {
    return function json_decode(ctx, next) {
      ctx[key] = json_decoder.convert(ctx[key]);
      return next();
    };
  },
  {
    convert(data: string) {
      if (typeof data !== 'string') {
        // console.warn('b_json.convert: not string', data);
        return data;
      }
      data = data.trim();
      return data === ''
        ? void 0
        : JSON.parse(data, function (key, value) {
            if (typeof value === 'string' && /^\d+n$/.test(value))
              return BigInt(value.slice(0, -1));
            return value;
          });
    },
  },
);

export const batch_sender = function (opts: {
  ms: number;
  ignore?(ctx: Client.Context): boolean;
  send(
    data: Pick<Client.Context<'/batch'>, 'path' | 'input' | 'codeCbs'> & {
      outMiddle: Middle<Client.Context>;
    },
  ): void;
}): Middle<Client.Context> {
  const inQueue: Client.Context[] = [];
  const outQueue: Client.Context[] = [];
  return function batch_send(ctx, next) {
    if (ctx.path === '/batch' || opts.ignore?.(ctx)) return next();
    inQueue.push(ctx);
    if (outQueue.length || inQueue.length > 1) return;
    globalThis.setTimeout(() => {
      if (inQueue.length === 1) {
        inQueue.length = 0;
        return next();
      }
      opts.send({
        path: '/batch',
        input: inQueue.map((e) => [e.path, e.input]) as [string, any][],
        codeCbs: {
          [OutputCode.Success.value](res) {
            outQueue.forEach((e, i) => e.onData(res.data[i]));
          },
        },
        outMiddle(ctx, next) {
          try {
            next();
          } finally {
            outQueue.length = 0;
          }
        },
      });
      outQueue.push(...inQueue);
      inQueue.length = 0;
    }, opts.ms);
  };
};
export const batch_handler = function (opts: {
  handle(ctx: Server.Context): MaybePromise<z.infer<Output>>;
}) {
  return async function batch_handle(ctx: Server.Context<'/batch'>, next) {
    if (ctx.path !== '/batch') return next();
    const output = await Promise.all(
      ctx.input.map(([path, input]) =>
        opts.handle(Object.assign(Object.create(ctx), { path, input })),
      ),
    );
    ctx.send({ code: OutputCode.Success.value, msg: '', data: output });
  } as Middle<Server.Context>;
};

export function zod_checker<
  K extends 'in' | 'out',
  T extends { api: ApiRecord } & { [P in `${K}put`]: unknown },
>(opts: { type: K; onFail(ctx: T, reason: unknown): void }): Middle<T> {
  return async function zod_check(ctx, next) {
    const key = `${opts.type}put` as const;
    const {
      error: err,
      success,
      data,
    } = await ctx.api[opts.type].spa(ctx[key]);
    if (!success) return opts.onFail(ctx, err.format());
    ctx[key] = data;
    return next();
  };
}
