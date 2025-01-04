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
  createContext<P extends keyof T = keyof T>(ctx: Client.LeastContext<P>) {
    const _ctx = ctx as unknown as Client.Context;
    _ctx.onData ??= (() => {
      const run = this.out.compose();
      return (output) => {
        _ctx.output = output;
        run(_ctx);
      };
    })();
    _ctx.onError ??= console.error;
    return _ctx;
  }
  send<P extends keyof T>(
    ...[ctx, ...e]: Parameters<ComposedMiddle<Client.LeastContext<P>>>
  ) {
    return this.in.compose()(this.createContext(ctx), ...e);
  }
}

export declare namespace Router {
  interface Context<P extends keyof T = keyof T> extends ApiContext<P> {}
  type Handler<P extends keyof T = keyof T> = (
    ctx: Context<P>,
  ) => MaybePromise<T[P]['out']>;
  type Routes = { [P in keyof T]?: Handler<P> };
  interface Options {
    routes: Routes;
    onNoRoute(ctx: Context): void;
  }
}
export class Router extends Onion<Router.Context> {
  constructor(private opts: Router.Options) {
    super();
    this.use(async (ctx, next) => {
      const output = await next();
      ctx.output ??= output;
    });
  }
  compose(): ComposedMiddle<Router.Context> {
    const { routes } = this.opts;
    const middles = [...this.middles];
    middles.push(async (ctx) => {
      const handler = routes[ctx.path];
      return handler
        ? //@ts-ignore
          await handler.call(routes, ctx)
        : this.opts.onNoRoute(ctx);
    });
    return new Onion(middles).compose();
  }
}
