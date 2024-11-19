/**
 * a_* means send end
 * b_* means receive end
 */
import { error, type Middle } from '..';
import { BizCode } from '../data';
import {
  Client,
  type ApiRecord,
  type ApiRecordTypes,
  type ClientContext,
  type Input,
} from '../router';

export const a_json = Object.assign(
  <K extends string>(opts: { key: K }) => {
    return {
      a_json: ((ctx, next) => {
        ctx[opts.key] = a_json.convert(ctx[opts.key]);
        return next();
      }) as Middle<{ [P in K]: any }>,
    }.a_json;
  },
  {
    convert: (data: any) =>
      JSON.stringify(data, function (key, value) {
        if (typeof value === 'bigint') return value + 'n';
        return value;
      }),
  },
);
export const b_json = Object.assign(
  <K extends string>(opts: { key: K }) => {
    return {
      b_json: ((ctx, next) => {
        ctx[opts.key] = b_json.convert(ctx[opts.key]);
        return next();
      }) as Middle<{ [P in K]: any }>,
    }.b_json;
  },
  {
    convert: (data: string) => {
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

export const a_batch = (opts: {
  ms: number;
  client: Client<ApiRecordTypes>;
  ignore?(ctx: ClientContext): boolean;
}): Middle<ClientContext> => {
  const sendQueue: ClientContext[] = [];
  const handleQueue: ClientContext[] = [];
  return function a_batch(ctx, next) {
    if (ctx.path === '/batch' || opts.ignore?.(ctx)) return next();
    sendQueue.push(ctx);
    if (handleQueue.length || sendQueue.length > 1) return;
    globalThis.setTimeout(() => {
      if (sendQueue.length === 1) {
        sendQueue.length = 0;
        return next();
      }
      opts.client
        .with('out', async function clearBatchQueue(ctx, next) {
          try {
            await next();
          } finally {
            handleQueue.length = 0;
          }
        })
        .send({
          path: '/batch',
          input: sendQueue.map((e) => [e.path, e.input]),
          codeCbs: {
            [BizCode.Success.value](res) {
              handleQueue.forEach((e, i) => e.onData(res.data[i]));
            },
          },
        });
      handleQueue.push(...sendQueue);
      sendQueue.length = 0;
    }, opts.ms);
  };
};
export const b_batch = <
  T extends { path: string; input: Input['/batch']; output: unknown },
>(opts: {
  createContext(ctx: T, data: { path: string; input: any }): T;
  callRoute(ctx: T): MaybePromise<void>;
  onSuccess(ctx: T, output: T['output'][]): void;
}): Middle<T> =>
  async function b_batch(ctx, next) {
    if (ctx.path !== '/batch') return next();
    const output = await Promise.all(
      ctx.input.map(async ([path, input]) => {
        const data = { path, input };
        const newCtx = opts.createContext(ctx, data);
        await opts.callRoute(newCtx);
        return newCtx.output;
      }),
    );
    return opts.onSuccess(ctx, output);
  };

export function zodCheck<
  K extends 'in' | 'out',
  T extends { api: ApiRecord } & { [P in `${K}put`]: unknown },
>(opts: { type: K; onFail(ctx: T, reason: unknown): void }): Middle<T> {
  return async function zodCheck(ctx, next) {
    try {
      const key = `${opts.type}put` as const;
      const {
        error: err,
        success,
        data,
      } = await ctx.api[opts.type].spa(ctx[key]);
      if (!success) return opts.onFail(ctx, err.format());
      ctx[key] = data;
    } catch (err) {
      error('zodCheck', err);
    } finally {
      return next();
    }
  };
}
