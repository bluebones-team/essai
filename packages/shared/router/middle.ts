/**
 * a_* means send end
 * b_* means receive end
 */
import { Client, Router, type ApiRecord } from '.';
import { error, type Middle } from '..';
import { OutputCode } from '../data';

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
  send(
    data: Pick<Client.Context<'/batch'>, 'path' | 'input' | 'codeCbs'> & {
      outMiddle: Middle<Client.Context>;
    },
  ): void;
  ignore?(ctx: Client.Context): boolean;
}): Middle<Client.Context> => {
  const inQueue: Client.Context[] = [];
  const outQueue: Client.Context[] = [];
  return function a_batch(ctx, next) {
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
export const b_batch = (opts: {
  handle(newCtx: Router.Context): MaybePromise<void>;
  onSuccess(ctx: Router.Context, output: Router.Context['output'][]): void;
}) =>
  async function b_batch(ctx: Router.Context<'/batch'>, next) {
    if (ctx.path !== '/batch') return next();
    const output = await Promise.all(
      ctx.input.map(async ([path, input]) => {
        const newCtx = new Proxy(
          { path, input } as Router.Context,
          //@ts-ignore
          { get: (o, p) => o[p] ?? ctx[p] },
        );
        await opts.handle(newCtx);
        return newCtx.output;
      }),
    );
    return opts.onSuccess(ctx, output);
  } as Middle<Router.Context>;

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
