import type { Middleware } from 'koa';
import pino from 'pino';
const logger = pino({
  level: process.env.NODE_ENV === 'product' ? 'info' : 'debug',
  transport: {
    targets: [
      {
        target: 'pino-pretty',
      },
      {
        target: 'pino/file',
        level: 'error',
        options: {
          destination: 'logs/error.log',
          mkdir: true,
        },
      },
      {
        target: 'pino/file',
        level: 'info',
        options: {
          destination: 'logs/info.log',
          mkdir: true,
        },
      },
    ],
  },
});

export const koaLogger: Middleware = async (ctx, next) => {
  ctx.log = logger;
  ctx.log.info(
    `Request: ${ctx.ip} ${ctx.method} ${ctx.path} ${JSON.stringify(ctx.request.body)}`
  );
  await next();
};
