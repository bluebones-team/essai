import type { IncomingMessage, ServerResponse } from 'http';
import WebSocket from 'ws';
import { Onion, type ComposedMiddle, type Middle } from '..';
import type { ApiRecordTypes as T } from './api';

type ApiContext<P extends keyof T = keyof T> = {
  path: P;
  input: T[P]['in'];
  output: T[P]['out'];
};
class TempOnion<T extends {}> extends Onion<T, 'with'> {
  tempMiddles: Middle<T>[] = [];
  /**add temporary middle */
  with(middle: Middle<T>) {
    this.tempMiddles.push(middle);
    return this;
  }
  compose() {
    const middles = [...this.middles];
    middles.splice(this.markers.with ?? middles.length, 0, ...this.tempMiddles);
    this.tempMiddles.length = 0;
    return new Onion(middles).compose();
  }
}

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
  in = new TempOnion<Client.Context>();
  out = new TempOnion<Client.Context>();
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

export declare namespace Server {
  type ExtraContext<P extends keyof T = keyof T> = {
    req: IncomingMessage;
    res?: ServerResponse;
    ws?: WebSocket;
    send(output: T[P]['out']): void;
  };
  interface Context<P extends keyof T = keyof T>
    extends ApiContext<P>,
      ExtraContext<P> {}
  type LeastContext<P extends keyof T = keyof T> = PartialByKey<
    Context<P>,
    'send' | 'output'
  >;
}
export class Server {
  in = new Onion<Server.Context>();
  out = new Onion<Server.Context>();
  createContext<P extends keyof T = keyof T>(ctx: Server.LeastContext<P>) {
    const _ctx = ctx as unknown as Server.Context;
    _ctx.send ??= (() => {
      const run = this.out.compose();
      return (output) => {
        _ctx.output = output;
        run(_ctx);
      };
    })();
    return _ctx;
  }
  createHandler() {
    const run = this.in.compose();
    return <P extends keyof T>(
      ...[ctx, ...e]: Parameters<ComposedMiddle<Server.LeastContext<P>>>
    ) => run(this.createContext(ctx), ...e);
  }
}
