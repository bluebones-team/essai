import { type Middle } from '..';
import { BizCode } from '../data';
import { a_batch, a_json, b_json, zodCheck } from '../middle';
import {
  apiRecords,
  type ApiRecords,
  type ApiRecordTypes,
  type Input,
  type Output,
  type Path,
} from './api';
import { Client } from './rpc';

export const devPort = 3000;
export function getApiURL<T extends 'http' | 'ws' = 'http'>(
  isDev: boolean,
  protocol = 'http' as T,
) {
  return isDev
    ? (`${protocol}://localhost:${devPort}` as const)
    : (`${protocol}s://essai.bluebones.fun/api` as const);
}

type CodeCbs<O extends { code: BizCode }> = {
  [K in O['code']]?: (
    res: O extends { code: infer C } ? (K extends C ? O : never) : never,
  ) => void;
};
declare module './rpc' {
  namespace Client {
    interface ExtraContext<T, P> {
      //@ts-ignore
      api: ApiRecords[P];
      signal?: AbortSignal;
      //@ts-ignore
      codeCbs: CodeCbs<Output[P]>;
    }
  }
}
export type ClientContext<P extends Path = Path> = Client.Context<
  ApiRecordTypes,
  P
>;
export function createClient(opts: {
  send(ctx: ClientContext): void;
  error(msg: string, ...e: any): void;
  setToken(token: Shared.Token): void;
}) {
  const client = new Client<ApiRecordTypes>({ onError: opts.error });
  client
    .use(function addApiRecord(ctx, next) {
      ctx.api = apiRecords[ctx.path];
      if (!ctx.api) return opts.error(`invalid path: ${ctx.path}`);
      return next();
    })
    .use(
      zodCheck({
        type: 'in',
        onFail: (ctx, reason) => opts.error(`${ctx.path} in`, reason),
      }),
    )
    .use(function defaultCbs(ctx, next) {
      ctx.onError = (err) => opts.error(`${ctx.path}.onError: ${err}`, err);
      ctx.codeCbs = {
        [BizCode.Fail.value]: (res) =>
          opts.error(`${BizCode[res.code].name} ${res.msg}`),
        [BizCode.Unauthorizen.value]: () =>
          client.send({
            path: '/token/refresh',
            input: void 0,
            codeCbs: {
              [BizCode.Success.value](res) {
                opts.setToken(res.data);
                client.send(ctx);
              },
            },
          }),
        ...ctx.codeCbs,
      };
      if (ctx.path === '/token/refresh') {
        ctx.codeCbs[BizCode.Unauthorizen.value] = () =>
          opts.error('请重新登录');
      }
      return next();
    })
    .use(
      a_batch({ ms: 2e2, client, ignore: (ctx) => ctx.api.meta.type === 'ws' }),
    )
    .mark('in-insert')
    .use(a_json({ key: 'input' }))
    .use(opts.send)
    .mark('---')
    .use(b_json({ key: 'output' }))
    .use(
      zodCheck({
        type: 'out',
        onFail: (ctx, reason) => opts.error(`${ctx.path} out`, reason),
      }),
    )
    .mark('out-insert')
    .use(function callCodeCbs(ctx, next) {
      const cb = ctx.codeCbs[ctx.output.code];
      if (!cb)
        console.warn(`${ctx.path} no code callback for ${ctx.output.code}`);
      //@ts-ignore
      cb?.(ctx.output);
    });
  class ProxyClient<P extends Path> {
    constructor(public path: P) {
      this.path = path;
    }
    with(middle: Middle<ClientContext>) {
      client.with('in', middle);
      return this;
    }
    send(input: Input[P], codeCbs: CodeCbs<Output[P]> = {}) {
      const path = this.path;
      return client.send({ path, input, codeCbs });
    }
  }
  return new Proxy({} as { [P in keyof ApiRecords]: ProxyClient<P> }, {
    get: (_, path: Path) => new ProxyClient(path),
  });
}

// middlewares
export function abort(cb: (abort: () => void) => void): Middle<ClientContext> {
  return function abort(ctx, next) {
    const ac = new AbortController();
    cb(() => ac.abort());
    ctx.signal = ac.signal;
    return next();
  };
}
export function once(): Middle<ClientContext> {
  let abortFn: () => void;
  return function once(ctx, next) {
    abortFn?.();
    return abort((x) => (abortFn = x))(ctx, next);
  };
}
export function progress<T, K extends BooleanKey<T>>(
  obj: T,
  key: K,
): Middle<ClientContext> {
  const o = {
    //@ts-ignore
    set value(v) {
      obj[key] = v;
      if (!v) delete this.value;
    },
  };
  return function progress(ctx, next) {
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
