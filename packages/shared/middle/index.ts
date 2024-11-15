/**
 * a_* means send end
 * b_* means receive end
 */
import { BizCode } from '../data';
import {
  type Input,
  type OutputCallbacks,
  type ReqData,
  type ResData,
} from '../router';
import { type Middle } from '..';

export const a_json = {
  convert: (data: any) =>
    JSON.stringify(data, function (key, value) {
      if (typeof value === 'bigint') return value + 'n';
      return value;
    }),
  middle:
    <K extends string>(opts: { key: K }): Middle<{ [P in K]: any }> =>
    (ctx, next) => {
      ctx[opts.key] = a_json.convert(ctx[opts.key]);
      return next();
    },
};
export const b_json = {
  convert: (data: string) => {
    data = data.trim();
    return data === ''
      ? void 0
      : JSON.parse(data, function (key, value) {
          if (typeof value === 'string' && /^\d+n$/.test(value))
            return BigInt(value.slice(0, -1));
          return value;
        });
  },
  middle:
    <K extends string>(opts: { key: K }): Middle<{ [P in K]: string }> =>
    (ctx, next) => {
      ctx[opts.key] = b_json.convert(ctx[opts.key]);
      return next();
    },
};

export const a_batch = (opts: {
  ms: number;
  send(d: {
    path: 'batch';
    data: Input['batch'];
    cbs: OutputCallbacks<'batch'>;
  }): void;
  ignore?(ctx: ReqData): boolean;
}) => {
  const queue: { send: ReqData[]; handle: ReqData[] } = {
    send: [],
    handle: [],
  };
  return {
    in(ctx, next) {
      if (ctx.path === 'batch' || opts.ignore?.(ctx)) return next();
      queue.send.push(ctx);
      if (queue.handle.length || queue.send.length !== 1) return;
      window.setTimeout(() => {
        if (queue.send.length === 1) return next();
        opts.send({
          path: 'batch',
          data: queue.send.map((e) => ({ p: e.path, d: e.data })),
          cbs: {
            [BizCode.Success.value](res) {
              queue.handle.forEach((e, i) => e.onData(res.data[i]));
            },
          },
        });
        queue.handle = [...queue.send];
        queue.send.length = 0;
      }, opts.ms);
    },
    async out(ctx, next) {
      await next();
      if (ctx.path === 'batch') {
        queue.handle.length = 0;
      }
    },
  } satisfies { in: Middle<ReqData>; out: Middle<ResData> };
};
export const b_batch = () => {
  return {
    in(ctx, next) {
      ctx.body;
      return next();
    },
    out(ctx, next) {
      ctx.body;
      return next();
    },
  } satisfies { in: Middle<{ body: any }>; out: Middle<{ body: any }> };
};
