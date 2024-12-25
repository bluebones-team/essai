import type { ParameterizedContext } from 'koa';
import { OutputCode } from 'shared/data';
import {
  apiRecords,
  b_batch,
  Router,
  zodCheck,
  type ApiRecords,
  type Path,
} from 'shared/router';
import { zocker } from 'zocker';
import { db } from '~/client';
import { tokenMgr } from '~/routes/service';
import { routes } from './api';
import { o } from './util';

declare module 'shared/router' {
  namespace Router {
    interface Context<P> extends ParameterizedContext {
      api: ApiRecords[Path];
      /**user data from token verification  */
      user: BTables['user'];
    }
  }
}
export const router: Router = new Router({ routes })
  .use(function addApiRecord(ctx, next) {
    ctx.api = apiRecords[ctx.path];
    if (!ctx.api) return o('fail', 'api not found');
    if (ctx.api.meta.type === 'ws') return o('fail', 'websocket not support');
    if (ctx.api.meta.type !== ctx.method.toLowerCase())
      return o('fail', 'method not allowed');
    return next();
  })
  .use(
    zodCheck({
      type: 'in',
      onFail: (ctx, reason) => o('fail', JSON.stringify(reason)),
    }),
  )
  .use(function auth(ctx, next) {
    if (!ctx.api.meta.token || ctx.user) return next();
    const token = ctx.req.headers.authorization;
    if (!token) return o(OutputCode.Unauthorizen.value);
    return tokenMgr.verify(token).then(
      async (payload) => {
        const user = (await db.read('user', payload))[0];
        if (!user) return o(OutputCode.NoUser.value);
        ctx.user = user;
        return next();
      },
      () => o(OutputCode.Unauthorizen.value),
    );
  })
  .use(
    b_batch({
      handle: (ctx) => routerMiddle(ctx),
      onSuccess: (ctx, output) => o('succ', output),
    }),
  )
  .mark('handle')
  .use((ctx) =>
    Object.assign(o(zocker(ctx.api.out.options[0]).generate()), { __mock: 1 }),
  );
export const routerMiddle = router.compose();
