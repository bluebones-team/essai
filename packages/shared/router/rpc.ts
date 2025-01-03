import { Onion, type ComposedMiddle, type Middle } from '..';
import type { ApiRecordTypes as T } from './api';

type ApiContext<P extends keyof T = keyof T> = {
  path: P;
  input: T[P]['in'];
  output: T[P]['out'];
};

export declare namespace Client {
  type ExtraContext<P extends keyof T = keyof T> = {
    onData(output: T[P]['out']): void;
    onError(err: unknown): void;
  };
  interface Context<P extends keyof T = keyof T>
    extends ApiContext<P>,
      ExtraContext<P> {}
  type LeastContext<P extends keyof T = keyof T> = PartialByKey<
    Context<P>,
    keyof ExtraContext<P> | 'output'
  >;
}
export class Client {
  static Flow = class extends Onion<Client.Context, 'with'> {
    _middles: Middle<Client.Context>[] = [];
    /**add temporary middle */
    with(middle: Middle<Client.Context>) {
      this._middles.push(middle);
      return this;
    }
    compose() {
      const middles = [...this.middles];
      middles.splice(this.markers.with ?? middles.length, 0, ...this._middles);
      this._middles.length = 0;
      return new Onion(middles).compose();
    }
  };
  in = new Client.Flow();
  out = new Client.Flow();
  send<const P extends keyof T>(
    ...[ctx, ...e]: Parameters<ComposedMiddle<Client.LeastContext<P>>>
  ) {
    const _ctx = ctx as unknown as Client.Context;
    _ctx.onData ??= (() => {
      const run = this.out.compose();
      return (output) => {
        _ctx.output = output;
        run(_ctx);
      };
    })();
    _ctx.onError ??= console.error;
    return this.in.compose()(_ctx, ...e);
  }
}

export declare namespace Router {
  interface Context<P extends keyof T = keyof T> extends ApiContext<P> {}
  type Handler<P extends keyof T = keyof T> = (
    ctx: Context<P>,
  ) => MaybePromise<T[P]['out']>;
  type Routes = { [P in keyof T]?: Handler<P> };
  interface Options {
    createContext(ctx: unknown): Context;
    routes: Routes;
  }
}
export class Router extends Onion<Router.Context, 'handle'> {
  private opts: Router.Options;
  constructor(opts: Partial<Router.Options> = {}) {
    super();
    this.opts = Object.assign(
      { createContext: (ctx: any) => ctx, routes: {} },
      opts,
    );
    this.use(async function (ctx, next) {
      ctx.output = await next();
    });
  }
  route<P extends keyof T>(path: P, handler: Router.Handler<P>) {
    //@ts-ignore
    this.opts.routes[path] = handler;
    return this;
  }
  private static handle(routes: Router.Routes): Middle<Router.Context> {
    return async (ctx, next) => {
      const handler = routes[ctx.path];
      //@ts-ignore
      return await (handler ? handler.call(routes, ctx) : next());
    };
  }
  compose(): ComposedMiddle<Router.Context> {
    const middles = [...this.middles];
    middles.splice(
      this.markers.handle ?? middles.length,
      0,
      Router.handle(this.opts.routes),
    );
    const middle = new Onion(middles).compose();
    return (ctx, ...e) => middle(this.opts.createContext(ctx), ...e);
  }
}
