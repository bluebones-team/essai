import type { inferRouterInputs, inferRouterOutputs } from '@trpc/server';
import type { CreateHTTPContextOptions } from '@trpc/server/adapters/standalone';
import type { Input, Output } from 'shared/client';
import { BizCode } from 'shared/enum';
import { createKoaMiddleware } from 'trpc-koa-adapter';
import { t, toRouter } from './api';
// import apiRouter from './implement';

const apiRouter = toRouter({});
export const appRouter = t.mergeRouters(
  apiRouter,
  t.router({ test: t.procedure.query(() => 'hello world') }), // test
);
function createContext(e: CreateHTTPContextOptions) {
  return e;
}
export const routes = createKoaMiddleware({ router: appRouter, createContext });
export const output = {
  /**提供类型检查 */
  data(output: Shared.Output) {
    return output;
  },
  succ<T>(data: T) {
    return { code: BizCode.Success._value, msg: '', data };
  },
  fail(msg: string) {
    return { code: BizCode.Fail._value, msg, data: null as any };
  },
};

export type Middleware = Parameters<typeof t.procedure.use>[0];
export type Context = ReturnType<typeof createContext>;

// Router type unit test
type ApiRouter = typeof apiRouter;
type _Input = isEuqal<Input, inferRouterInputs<ApiRouter>>;
type _Output = isEuqal<Output, inferRouterOutputs<ApiRouter>>;
type IsRouterCorrect<_ extends _Input & _Output = true> = _;
