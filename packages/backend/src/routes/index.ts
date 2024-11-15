import Router from 'koa-router';
import type { Model } from 'mongoose';
import { each } from 'shared';
import { BizCode } from 'shared/data';
import { apiConfig, zodCheck, type Path } from 'shared/router';
import { zocker } from 'zocker';
import { model } from '~/client';
import { tokenMgr } from '~/service';
import { routes } from './api';
import { o } from './util';
import { a_json } from 'shared/middle';

type ExtendContext = {
  user: Awaited<
    ReturnType<
      typeof model.user.add<
        typeof model.user extends Model<any, {}, infer M> ? M : never
      >
    >
  >;
};
type Middleware = Router.IMiddleware<any, ExtendContext>;
export type Context = Parameters<Middleware>[0];
const auth: Middleware = (ctx, next) => {
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
};

/**@see https://github.com/ZijianHe/koa-router */
export const router = new Router<any, ExtendContext>()
  .use(async (ctx, next) => {
    ctx.body = a_json.convert(await next());
  })
  .get('/', (ctx) => 'haha world')
  .use(
    zodCheck({
      key: 'input',
      getSchema: (ctx) => apiConfig[ctx.path.slice(1) as Path].in,
      onError: (ctx, reason) => o('fail', JSON.stringify(reason)),
    }),
  );
each(apiConfig, (api, path) => {
  const { meta } = api;
  const type = meta.type;
  if (type === 'ws') return;
  const mock = () =>
    Object.assign(o('succ', zocker(api.out.shape.data).generate()), {
      __mock: 1,
    });
  const middles: Middleware[] = [routes[path as Path] ?? mock];
  if (meta.token) middles.unshift(auth);
  router[type](`/${path}`, ...middles);
});
