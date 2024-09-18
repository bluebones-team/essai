import type { CreateTRPCProxyClient } from '@trpc/client';
import type { ProcedureOptions } from '@trpc/server';
import type { z } from 'zod';
import { error, flow, pick } from '..';
import { BizCode, shared } from '../data';
import { apiConfig, type ApiConfig } from './api';

export type Path = keyof ApiConfig;
export type Input = { [K in keyof ApiConfig]: z.infer<ApiConfig[K]['req']> };
export type Output = {
  [K in keyof ApiConfig]: Shared.Output<z.infer<ApiConfig[K]['res']>>;
};
type OutputCallbacks<
  P extends Path = Path,
  O extends Output[Path] = Output[P],
> = {
  [K in O['code']]?: (
    res: O extends { code: infer C } ? (K extends C ? O : never) : never,
  ) => void;
};
type ReqConfig<P extends Path = Path, I extends Input[Path] = Input[P]> = {
  path: P;
  input: I;
  option?: ProcedureOptions & { context?: CustomContext };
};
type ReqFn = (c: ReqConfig) => Promise<unknown>;
type ReqFnWrapper<F extends ReqFn = ReqFn> = (e: F) => F;
export type CustomContext = Partial<{
  token: string;
}>;

export function getApiURL(isDev: boolean, protocol = 'http') {
  return isDev
    ? `${protocol}://${location.hostname}:3001`
    : `${protocol}s://essai.bluebones.fun/api`;
}
export function createClient(
  t: CreateTRPCProxyClient<any>,
  options: {
    showTip(e: { text: string; color?: string }): void;
    token: {
      get: (k: keyof Shared.Token) => string;
      set: (d: Shared.Token) => void;
    };
  },
) {
  /**校验数据 */
  function check<T>(schema: z.ZodType, raw: T, dtype: string): T {
    const { error: err, success, data } = schema.safeParse(raw);
    if (success) return data;
    else {
      options.showTip({ text: `数据校验失败 ${dtype}`, color: 'error' });
      error(`error fetch ${dtype}:`, raw, err.format());
      return raw;
    }
  }
  /**更新 token */
  function refreshToken(resend: () => void) {
    new Fetch('token/refresh', null).send({
      0(res) {
        options.token.set(res.data);
        resend();
      },
      [BizCode.Unauthorizen._value]: () =>
        options.showTip({ text: '请重新登录' }),
    });
  }
  /**
   * 响应处理器
   * @param output 响应数据
   * @param callbacks 数据处理器
   * @param resend 重发请求
   */
  function resCb(
    output: Output[Path],
    callbacks: OutputCallbacks,
    resend: () => void,
  ) {
    const show = (color: 'success' | 'error') => (o: typeof output) =>
      options.showTip({ text: `${BizCode[o.code]._name} ${o.msg}`, color });
    ({
      [BizCode.Success._value]: show('success'),
      [BizCode.Fail._value]: show('error'),
      [BizCode.Unauthorizen._value]: () => refreshToken(resend),
      ...callbacks,
    })[output.code]?.(output);
    return output;
  }
  const apiTypeMap = {
    get: 'query',
    post: 'mutate',
    ws: 'subscribe',
  } as const;
  /**请求器 */
  class Fetch<P extends Path> {
    path;
    input: Input[P];
    api;
    /**装饰器列表 */
    wrappers: ReqFnWrapper[] = [];
    constructor(path: P, input: Input[P]) {
      this.api = apiConfig[path];
      this.path = path;
      this.input = check(this.api.req, input, 'input');
    }
    /**添加装饰器 */
    use(w: ReqFnWrapper) {
      this.wrappers.push(w);
      return this;
    }
    /**响应处理 */
    resHander(cbs?: OutputCallbacks<P>) {
      return {
        onSuccess: (output: Output[P]) => {
          output = check(shared.output(this.api.res), output, 'output');
          resCb(output, cbs ?? {}, () => this.send(cbs));
        },
        onError(err: unknown) {
          options.showTip({ text: err + '', color: 'error' });
          error('error fetch:', err);
        },
      };
    }
    /**请求函数 */
    reqFn(c: ReqConfig) {
      const { type, meta } = this.api;
      Object.assign(((c.option ??= {}).context ??= {}), {
        token: meta?.token && options.token.get(meta.token),
      });
      const procType = apiTypeMap[type];
      //@ts-ignore
      const handle = t[c.path][procType];
      if (!handle) debugger;
      return handle(c.input, c.option);
    }
    /**发送请求 */
    send(callbacks?: OutputCallbacks<P>) {
      const { onSuccess, onError } = this.resHander(callbacks);
      this.wrappers.push(
        apiTypeMap[this.api.type] === 'subscribe'
          ? (fn) => (c) => {
              Object.assign((c.option ??= {}), { onData: onSuccess, onError });
              return fn(c);
            }
          : (fn) => (c) => {
              //@ts-ignore
              return fn(c).then(onSuccess, onError);
            },
      );
      return flow(...this.wrappers.reverse())(this.reqFn.bind(this))(
        pick(this, ['path', 'input']),
      );
    }
  }
  return Fetch;
}

// wrapper
export function abort(cb: (abort: () => void) => void): ReqFnWrapper {
  return (fn) => (c) => {
    const ac = new AbortController();
    cb(() => ac.abort());
    Object.assign((c.option ??= {}), { signal: ac.signal });
    return fn(c);
  };
}
export function once(): ReqFnWrapper {
  let abortFn: () => void;
  return (fn) => (c) => {
    abortFn?.();
    return abort((x) => (abortFn = x))(fn)(c);
  };
}
export function progress<T, K extends BooleanKey<T>>(
  obj: T,
  key: K,
): ReqFnWrapper {
  function set(v: boolean) {
    //@ts-ignore
    obj[key] = v;
  }
  return (fn) => (c) => {
    set(true);
    return fn(c).finally(() => {
      set(false);
    });
  };
}
