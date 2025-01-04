import { packageName, type Middle } from '..';
import { OutputCode, type ExtractOutput } from '../data';
import {
  apiRecords,
  type ApiRecords,
  type ApiRecordTypes,
  type In,
  type Out,
  type Path,
} from './api';
import { a_batch, a_json, b_json, zodCheck } from './middle';
import { Client } from './rpc';

export const devPort = 3000;
export function getApiURL<T extends 'http' | 'ws' = 'http'>(
  isDev: boolean,
  protocol = 'http' as T,
) {
  return isDev
    ? (`${protocol}://localhost:${devPort}` as const)
    : (`${protocol}s://${packageName}.bluebones.fun/api` as const);
}

type CodeCbs<O extends { code: OutputCode }> = {
  [K in O['code']]?: (res: ExtractOutput<O, K>) => void;
};
declare module './rpc' {
  namespace Client {
    interface Context<P> {
      api: ApiRecords[P];
      signal?: AbortSignal;
      codeCbs: CodeCbs<Out[P]>;
    }
  }
}
export function createClient(opts: {
  send(ctx: Client.Context): void;
  error(msg: string, ...e: any): void;
  setToken(token: Shared['token']): void;
}) {
  const client = new Client();
  client.in
    .use(
      zodCheck({
        type: 'in',
        onFail: (ctx, reason) =>
          opts.error(`${ctx.path} 请求数据校验失败`, reason),
      }),
    )
    .use(
      a_batch({
        ms: 2e2,
        send({ path, input, codeCbs, outMiddle }) {
          client.out.with(outMiddle);
          new ProxyClient(path).send(input, codeCbs);
        },
        ignore: (ctx) => ctx.api.meta.type === 'ws',
      }),
    )
    .mark('with')
    .use(a_json({ key: 'input' }))
    .use(opts.send);
  client.out
    .use(b_json({ key: 'output' }))
    .use(
      zodCheck({
        type: 'out',
        onFail: (ctx, reason) =>
          opts.error(`${ctx.path} 响应数据校验失败`, reason),
      }),
    )
    .mark('with')
    .use(function callCodeCbs(ctx, next) {
      const cb = ctx.codeCbs[ctx.output.code];
      if (!cb) return opts.error(OutputCode.NoUser.msg);
      //@ts-ignore
      cb(ctx.output);
    });
  class ProxyClient<P extends Path> {
    constructor(public path: P) {
      this.path = path;
    }
    with(middle: Middle<Client.Context>) {
      client.in.with(middle);
      return this;
    }
    send(input: In[P], codeCbs: CodeCbs<Out[P]> = {}) {
      const path = this.path;
      const api = apiRecords[path];
      if (!api) return opts.error(`invalid path: ${path}`);
      const ctx: Client.LeastContext = {
        path,
        input,
        api,
        codeCbs: {
          [OutputCode.Fail.value]: (res) =>
            opts.error(`${OutputCode[res.code].name} ${res.msg}`),
          [OutputCode.Unauthorizen.value]() {
            new ProxyClient('/token/refresh').send(void 0, {
              [OutputCode.Success.value](res) {
                opts.setToken(res.data);
                opts.send(client.createContext(ctx));
              },
              [OutputCode.Unauthorizen.value]() {
                opts.error('请重新登录');
              },
            });
          },
          ...codeCbs,
        },
        onError(err) {
          opts.error(`${path}.onError: ${err}`, err);
        },
      };
      return client.send(ctx);
    }
  }
  return new Proxy({} as { [P in keyof ApiRecordTypes]: ProxyClient<P> }, {
    get: (_, path: Path) => new ProxyClient(path),
  });
}

// middlewares
export function abort(cb: (abort: () => void) => void): Middle<Client.Context> {
  return function abort(ctx, next) {
    const ac = new AbortController();
    cb(() => ac.abort());
    ctx.signal = ac.signal;
    return next();
  };
}
export function once(): Middle<Client.Context> {
  let abortFn: () => void;
  return function once(ctx, next) {
    abortFn?.();
    return abort((x) => (abortFn = x))(ctx, next);
  };
}
export function progress<T, K extends BooleanKey<T>>(
  obj: T,
  key: K,
): Middle<Client.Context> {
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
