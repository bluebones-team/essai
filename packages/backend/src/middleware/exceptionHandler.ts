import type { Middleware } from 'koa';
import { SystemError } from '~/error';

export const exceptionHandler: Middleware = (ctx, next) =>
  next().catch((err) => {
    ctx.status = 500;
    ctx.log.error(err);
    if (err instanceof SystemError) {
      ctx.body = err.message;
    } else {
      ctx.body = 'Uncaught Error';
    }
  });
