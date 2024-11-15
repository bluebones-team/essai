import { z } from 'zod';
import { error, Onion, type Middle } from '..';
import { BizCode, shared } from '../data';
import { a_batch, a_json } from '../middle';
import { apiConfig, type ApiConfig } from './api';

export type Path = keyof ApiConfig;
export type Input = { [K in keyof ApiConfig]: z.infer<ApiConfig[K]['in']> };
export type Output = { [K in keyof ApiConfig]: z.infer<ApiConfig[K]['out']> };
export type OutputCallbacks<
  P extends Path = Path,
  O extends Output[Path] = Output[P],
> = {
  [K in O['code']]?: (
    res: O extends { code: infer C } ? (K extends C ? O : never) : never,
  ) => void;
};
type Data<P extends Path = Path> = {
  path: P;
};
export type ReqData<P extends Path = Path> = Data<P> & {
  meta: ApiConfig[P]['meta'];
  data: Input[P];
  onData(d: Output[P]): void;
  onError(e: any): void;
  signal?: AbortSignal;
};
export type ResData<P extends Path = Path> = Data<P> & {
  data: Output[P];
  cbs: OutputCallbacks<P>;
};

export const devPort = 3000;
export function getApiURL<T extends 'http' | 'ws' = 'http'>(
  isDev: boolean,
  protocol = 'http' as T,
) {
  return isDev
    ? (`${protocol}://localhost:${devPort}` as const)
    : (`${protocol}s://essai.bluebones.fun/api` as const);
}
/**zod schema check middleware */
export function zodCheck<
  K extends string,
  T extends { path: string } & { [P in K]: any },
>(opts: {
  key: K;
  getSchema(ctx: T): z.ZodType;
  onError(ctx: T, reason: unknown): void;
}): Middle<T> {
  return async (ctx, next) => {
    try {
      const {
        error: err,
        success,
        data,
      } = await opts.getSchema(ctx).spa(ctx[opts.key]);
      if (!success) return opts.onError(ctx, err.format());
      ctx[opts.key] = data;
    } catch (err) {
      error('zodCheck', err);
    } finally {
      return next();
    }
  };
}
export function createReqData<P extends Path>(
  path: P,
  data: Input[P],
): ReqData<P> {
  const { meta } = apiConfig[path];
  return {
    path,
    data,
    meta,
    onData: (d) => {},
    onError: (e) => {},
  };
}
export function createClient(opts: {
  send(ctx: ReqData): void;
  error(msg: string, ...e: any): void;
  token: { get(k: keyof Shared.Token): string; set(d: Shared.Token): void };
}) {
  const batch = a_batch({
    ms: 2e2,
    send(d) {
      new Client(d.path).send(d.data, d.cbs);
    },
  });
  const middles = {
    in: [
      zodCheck({
        key: 'data',
        getSchema: (ctx) => apiConfig[ctx.path].in,
        onError: (ctx, reason) => opts.error(`${ctx.path} in`, reason),
      }),
      batch.in,
      a_json.middle({ key: 'data' }),
      async (ctx, next) => {
        await next();
        opts.send(ctx);
      },
    ] as Middle<ReqData>[],
    out: [
      zodCheck({
        key: 'data',
        getSchema: (ctx) =>
          ctx.data.code === BizCode.Success.value
            ? apiConfig[ctx.path].out
            : shared.output(),
        onError: (ctx, reason) => opts.error(`${ctx.path} out`, reason),
      }),
      batch.out,
      async (ctx, next) => {
        await next();
        const cb = ctx.cbs[ctx.data.code];
        if (!cb) console.warn(`${ctx.path}:${ctx.data.code} no callback`);
        cb?.(ctx.data);
      },
    ] as Middle<ResData>[],
  };
  const handle =
    (out: Onion<ResData>, callbacks: OutputCallbacks): Middle<ReqData> =>
    (ctx, next) => {
      ctx.onData = (data) => out.run({ path: ctx.path, data, cbs: callbacks });
      ctx.onError = (err) => opts.error(`${ctx.path}: ${err}`, err);
      return next();
    };
  class Client<P extends Path> {
    path: P;
    in: Onion<ReqData>;
    out: Onion<ResData>;
    resend?: () => void;
    constructor(path: P) {
      this.path = path;
      this.in = new Onion<ReqData>(middles.in);
      this.out = new Onion<ResData>(middles.out);
    }
    use(inM?: Middle<ReqData>, outM?: Middle<ResData>) {
      inM && this.in.use(inM);
      outM && this.out.use(outM);
      return this;
    }
    send(data?: Input[P], callbacks: OutputCallbacks<P> = {}) {
      if (!this.resend) {
        this.resend = () => this.send(data, callbacks);
        this.in.use(
          handle(this.out, {
            [BizCode.Fail.value]: (res) =>
              opts.error(`${BizCode[res.code].name} ${res.msg}`),
            [BizCode.Unauthorizen.value]: () => refreshToken(this.resend!),
            ...callbacks,
          }),
        );
      }
      this.in.run(createReqData(this.path, data!));
    }
  }
  function refreshToken(resend: () => void) {
    new Client('token/refresh').send(void 0, {
      [BizCode.Success.value](res) {
        opts.token.set(res.data);
        resend();
      },
      [BizCode.Unauthorizen.value]: () => opts.error('请重新登录'),
    });
  }
  return new Proxy({} as { [P in keyof ApiConfig]: Client<P> }, {
    get(_, path) {
      return new Client(path as Path);
    },
  });
}
// middlewares
export function abort(cb: (abort: () => void) => void): Middle<ReqData> {
  return (ctx, next) => {
    const ac = new AbortController();
    cb(() => ac.abort());
    ctx.signal = ac.signal;
    return next();
  };
}
export function once(): Middle<ReqData> {
  let abortFn: () => void;
  return (ctx, next) => {
    abortFn?.();
    return abort((x) => (abortFn = x))(ctx, next);
  };
}
export function progress<T, K extends BooleanKey<T>>(
  obj: T,
  key: K,
): Middle<ReqData> {
  const o = {
    //@ts-ignore
    set value(v) {
      obj[key] = v;
      if (!v) delete this.value;
    },
  };
  return (ctx, next) => {
    o.value = true;
    const { onData, onError } = ctx;
    ctx.onData = (d) => {
      o.value = false;
      onData(d);
    };
    ctx.onError = (e) => {
      o.value = false;
      onError(e);
    };
    return next();
  };
}
