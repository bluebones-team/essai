import type { ComposedMiddle } from 'shared';
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
import { tokenMgr } from '~/router/service';
import { isWsContext, o } from '../util';
import { routes } from './routes';

declare module 'shared/router' {
  namespace Router {
    interface Context<P> extends BaseContext {
      api: ApiRecords[P];
      token?: string;
      /**user data from token verification  */
      user?: BTables['user'];
    }
  }
}
const router = new Router({
  routes,
  onNoRoute: ({ api }) =>
    //@ts-ignore
    Object.assign(o(zocker(api.out.options[0]).generate()), {
      __mock: 1,
    }),
})
  .use(function checkApi(ctx, next) {
    if (!ctx.api) return o('fail', 'api not found');
    if (
      ctx.api.meta.type !==
      (isWsContext(ctx) ? 'ws' : ctx.req.method?.toLowerCase())
    )
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
    if (!ctx.token) return o(OutputCode.Unauthorizen.value);
    return tokenMgr.verify(ctx.token).then(
      async (payload) => {
        const user = (await db.read('user', payload))[0];
        if (!user) return o(OutputCode.NoUser.value);
        ctx.user = user;
        return next();
      },
      () => o(OutputCode.Unauthorizen.value),
    );
  })
  .use(b_batch({ handle: (ctx) => routerMiddle(ctx) }));
const composedMiddle = router.compose();
export const routerMiddle: ComposedMiddle<BaseContext> = async (ctx) => {
  const newCtx: Router.Context = Object.assign(
    Object.create(ctx) as typeof ctx,
    {
      api: apiRecords[ctx.path as Path],
      path: ctx.path as Path,
      token: ctx.req.headers.authorization,
    },
  );
  await composedMiddle(newCtx);
  ctx.output = newCtx.output;
};
