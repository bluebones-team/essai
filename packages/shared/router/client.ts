import { type Middle } from '..';
import { OutputCode, type ExtractOutput } from '../data';
import {
  apiRecords,
  type ApiRecords,
  type In,
  type Out,
  type Path,
} from './api';
import {
  batch_sender,
  json_encoder,
  json_decoder,
  zod_checker,
} from './middle';
import { Client } from './rpc';

type CodeCallbacks<O extends { code: OutputCode }> = {
  [K in O['code']]?: (res: ExtractOutput<O, K>) => void;
} & { _?: (res: O) => void };
declare module './rpc' {
  namespace Client {
    interface Context<P> {
      api: ApiRecords[P];
      signal?: AbortSignal;
      codeCbs: CodeCallbacks<Out[P]>;
    }
  }
}
export function createClient(opts: {
  sender(ctx: Client.Context): void;
  error(msg: string, ...e: any): void;
  setToken(token: Shared['token']): void;
}) {
  const client = new Client();
  client.in
    .use(
      zod_checker({
        type: 'in',
        onFail: (ctx, reason) =>
          opts.error(`${ctx.path} 请求数据校验失败`, reason),
      }),
    )
    .use(
      batch_sender({
        ms: 2e2,
        send({ path, input, codeCbs, outMiddle }) {
          client.out.with(outMiddle);
          new ProxyClient(path).send(input, codeCbs);
        },
        ignore: (ctx) => ctx.api.meta.type === 'ws',
      }),
    )
    .mark('with')
    .use(json_encoder('input'))
    .use(opts.sender);
  client.out
    .use(json_decoder('output'))
    .use(
      zod_checker({
        type: 'out',
        onFail: (ctx, reason) =>
          opts.error(`${ctx.path} 响应数据校验失败`, reason),
      }),
    )
    .mark('with')
    .use(function callCodeCbs(ctx, next) {
      const cb = ctx.codeCbs[ctx.output.code] ?? ctx.codeCbs._;
      cb
        ? //@ts-ignore
          cb(ctx.output)
        : opts.error(`no codeCbs: ${ctx.path}:${ctx.output.code}`);
    });
  class ProxyClient<P extends keyof ApiRecords> {
    constructor(public path: P) {
      this.path = path;
    }
    with(middle: Middle<Client.Context>) {
      client.in.with(middle);
      return this;
    }
    send(input: In[P], codeCbs: CodeCallbacks<Out[P]> = {}) {
      const path = this.path;
      const api = apiRecords[path];
      if (!api) return opts.error(`invalid path: ${path}`);
      //@ts-ignore
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
                opts.sender(client.createContext(ctx));
              },
              [OutputCode.Unauthorizen.value]() {
                opts.error('请重新登录');
              },
            });
          },
          [OutputCode.ServerError.value]({ msg }) {
            opts.error(msg);
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
  return new Proxy({} as { [P in keyof ApiRecords]: ProxyClient<P> }, {
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
