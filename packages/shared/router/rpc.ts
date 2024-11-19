import { Onion, pick, type ComposedMiddle, type Middle } from '..';
type ApiRecordType<In = unknown, Out = unknown> = { in: In; out: Out };
type ApiRecordTypes = Record<string, ApiRecordType>;
type ApiContext<T extends ApiRecordTypes, P extends keyof T = keyof T> = {
  path: P;
  input: T[P]['in'];
  output: T[P]['out'];
};

export function createProxyContext<T extends {}, U extends {}>(
  ctx: T,
  extra: U,
) {
  return new Proxy(extra as T & U, {
    //@ts-ignore
    get: (o, k) => o[k] ?? ctx[k],
    //@ts-ignore
    set: (o, k, v) => ((o[k] = v), true),
  });
}

export declare namespace Client {
  interface ExtraContext<T extends ApiRecordTypes, P extends keyof T> {}
  type SupplyContext<T extends ApiRecordTypes, P extends keyof T> = {
    middles: Middle<Context<T, P>>[];
    onData(output: T[P]['out']): void;
    onError(err: unknown): void;
  };
  type Context<
    T extends ApiRecordTypes,
    P extends keyof T = keyof T,
  > = ExtraContext<T, P> & SupplyContext<T, P> & ApiContext<T, P>;
  type LeastContext<
    T extends ApiRecordTypes,
    P extends keyof T = keyof T,
  > = Partial<ExtraContext<T, P> & SupplyContext<T, P>> &
    PartialByKey<ApiContext<T, P>, 'output'>;
  type Options = {
    onError?(msg: string, ...e: any): void;
  };
}
const clientMarkers = ['in-insert', 'out-insert', '---'] as const;
export class Client<T extends ApiRecordTypes> extends Onion<
  Client.Context<T>,
  (typeof clientMarkers)[number]
> {
  opts: Client.Options;
  constructor(opts: Client.Options) {
    super();
    this.opts = opts;
  }
  /**one-time data for send */
  private readonly OTD = {
    middles: null as null | Middle<Client.Context<T>>[],
    markers: null as null | Record<(typeof clientMarkers)[number], number>,
    default: () => {
      this.OTD.middles ??= [...this.middles];
      this.OTD.markers ??= pick(this.markers, [...clientMarkers]);
    },
    clear: () => {
      this.OTD.middles = null;
      this.OTD.markers = null;
    },
  };
  /**add middle for context */
  with(type: 'in' | 'out', middle: Middle<Client.Context<T>>) {
    this.OTD.default();
    this.OTD.middles!.splice(this.OTD.markers![`${type}-insert`]++, 0, middle);
    if (type === 'in') this.OTD.markers!['---']++;
    return this;
  }
  send<const P extends keyof T>(
    ...[ctx, ...e]: Parameters<ComposedMiddle<Client.LeastContext<T, P>>>
  ) {
    this.OTD.default();
    const newCtx: Client.Context<T> = {
      onData: (output) => outRun(Object.assign(newCtx, { output })),
      onError: console.error,
      //@ts-ignore
      middles: this.OTD.middles,
      output: void 0,
      ...ctx,
    };
    const cutIdx = this.OTD.markers!['---'];
    this.OTD.clear();
    const inRun = new Onion(newCtx.middles.slice(0, cutIdx)).composed;
    const outRun = new Onion(newCtx.middles.slice(cutIdx)).composed;
    return inRun(newCtx, ...e);
  }
}

declare namespace Router {
  type Options<T extends ApiRecordTypes, C extends {}> = {
    routes: {
      [K in keyof T]?: (
        ctx: C & { input: T[K]['in'] },
      ) => MaybePromise<T[K]['out']>;
    };
    createContext(ctx: C): ApiContext<T>;
    onNotFound?(ctx: C): void;
    onError?(ctx: C, err: unknown): void;
  };
}
export class Router<T extends ApiRecordTypes, C extends {}> extends Onion<C> {
  constructor(opts: Router.Options<T, C>) {
    super();
    super.use(async function setReturnAsOutput(ctx, next) {
      opts.createContext(ctx).output = await next();
    });
    super.use(async function callRoute(ctx, next) {
      const newCtx = opts.createContext(ctx);
      const route = opts.routes[newCtx.path];
      if (!route) {
        return (
          opts.onNotFound?.(ctx) ?? console.warn('Route NotFound', newCtx.path)
        );
      }
      try {
        return await route.call(
          opts.routes,
          createProxyContext(ctx, { input: newCtx.input }),
        );
      } catch (err) {
        return (
          opts.onError?.(ctx, err) ??
          console.error('Route Fail', newCtx.path, err)
        );
      }
    });
  }
  use(middle: Middle<C>) {
    super.use(middle, this.middles.length - 1);
    return this;
  }
}
