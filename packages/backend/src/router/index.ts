import { Onion, type ComposedMiddle } from 'shared';
import { OutputCode } from 'shared/data';
import { batch_handler, Server, zod_checker } from 'shared/router';
import { db } from '~/client';
import { o } from '~/util';
import { createContext, type RouterContext } from './context';
import { routes } from './routes';
import { tokenMgr } from './service';

const router = new Onion<RouterContext, 'batch_call_start'>()
  .use(async function sendReturn(ctx, next) {
    const output = await next();
    if (typeof output !== 'undefined') ctx.send(output);
  })
  .mark('batch_call_start')
  .use(function checkApi(ctx, next) {
    if (!ctx.api) return o.fail('api not found');
    if (ctx.api.meta.type !== (ctx.ws ? 'ws' : ctx.req.method?.toLowerCase()))
      return o.fail('method not allowed');
    return next();
  })
  .use(
    zod_checker({
      type: 'in',
      onFail: (ctx, reason) =>
        o({
          code: OutputCode.Fail.value,
          msg: 'input error',
          data: { input: ctx.input, reason },
        }),
    }),
  )
  .use(function auth(ctx, next) {
    if (!ctx.api.meta.token || ctx.user) return next();
    if (!ctx.token) return o(OutputCode.Unauthorizen.value);
    return tokenMgr
      .verify(ctx.token)
      .then(async (payload) => {
        const user = await db
          .selectFrom('user')
          .selectAll()
          .where((eb) => eb.and(payload))
          .executeTakeFirst();
        if (!user) return o(OutputCode.Unauthorizen.value);
        ctx.user = user;
        return next();
      })
      .catch(() => o(OutputCode.Unauthorizen.value));
  })
  .use(
    batch_handler({
      handle: (ctx) => routerMiddle(ctx, void 0, 'batch_call_start'),
    }),
  )
  .use(async function handleRoutes(ctx) {
    const handler = routes[ctx.path];
    try {
      //@ts-ignore
      if (handler) return await handler(ctx);
      return o.fail('api not implemented');
    } catch (err) {
      return o.error(`route error: ${ctx.path}`, err);
    }
  });

const run = router.compose();
export const routerMiddle: ComposedMiddle<Server.Context> = (ctx, ...e) =>
  //@ts-ignore
  run(createContext(ctx), ...e);
