import type { ParameterizedContext } from 'koa';
import type { Model } from 'mongoose';
import { BizCode } from 'shared/data';
import { b_batch, zodCheck } from 'shared/middle';
import {
  apiRecords,
  createProxyContext,
  Router,
  type ApiRecords,
  type ApiRecordTypes,
  type Path,
} from 'shared/router';
import { zocker } from 'zocker';
import { model } from '~/client';
import { tokenMgr } from '~/service';
import { routes } from './api';
import { o } from './util';

declare module 'koa' {
  interface ExtendableContext {
    path: Path;
    api: ApiRecords[Path];
    user: Awaited<
      ReturnType<
        typeof model.user.add<
          typeof model.user extends Model<any, {}, infer M> ? M : never
        >
      >
    >;
  }
}
export const router = new Router<ApiRecordTypes, ParameterizedContext>({
  routes,
  // @ts-ignore
  createContext: (ctx) => ctx,
  onNotFound: (ctx) =>
    Object.assign(
      o('succ', zocker(ctx.api.out.options[0].shape.data).generate()),
      { __mock: 1 },
    ),
})
  .use(function addApiRecord(ctx, next) {
    ctx.api = apiRecords[ctx.path];
    if (!ctx.api) return o('fail', 'api not found');
    if (ctx.api.meta.type === 'ws') return o('fail', 'websocket not support');
    if (ctx.api.meta.type !== ctx.method.toLowerCase())
      return o('fail', 'method not allowed');
    return next();
  })
  .use(function auth(ctx, next) {
    if (!ctx.api.meta.token || ctx.user) return next();
    const token = ctx.req.headers.authorization;
    if (!token)
      return o({ code: BizCode.Unauthorizen.value, msg: 'token not found' });
    return tokenMgr.verify(token).then(
      async (payload) => {
        const user = await model.user.findOne(payload);
        if (!user) return o('fail', '用户不存在');
        ctx.user = user;
        return next();
      },
      () => o({ code: BizCode.Unauthorizen.value, msg: 'token invalid' }),
    );
  })
  .use(
    zodCheck({
      type: 'in',
      onFail: (ctx, reason) => o('fail', JSON.stringify(reason)),
    }),
  )
  .use(
    b_batch<ParameterizedContext & { input: any }>({
      createContext: createProxyContext,
      callRoute: (ctx) => routerMiddle(ctx),
      onSuccess: (ctx, output) => o('succ', output),
    }),
  );
export const routerMiddle = router.composed;
