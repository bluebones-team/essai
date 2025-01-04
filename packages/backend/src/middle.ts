import type { IncomingMessage, ServerResponse } from 'http';
import { type Middle } from 'shared';
import { isWsContext, log, o } from './util';

export const middleAdaptor =
  (
    middle: (
      req: IncomingMessage,
      res: ServerResponse,
      next: () => void,
    ) => void,
  ): Middle<HttpContext> =>
  (ctx, next) =>
    middle(ctx.req, ctx.res, next);

/**@see https://developer.mozilla.org/zh-CN/docs/Web/HTTP/CORS */
export const cors: Middle<HttpContext> = (ctx, next) => {
  ctx.set({
    'access-control-allow-origin': '*',
    'access-control-allow-credentials': 'true',
    'content-type': 'application/json;charset=utf-8',
  });
  if (ctx.req.method !== 'OPTIONS') return next();
  ctx.set({
    'access-control-allow-methods': 'POST, GET, OPTIONS',
    'access-control-allow-headers': 'Authorization, Content-Type',
    'access-control-max-age': '3600',
  });
  ctx.send(204);
};
export const convert = (opts: {
  stringify(data: any): string;
  parse(data: string): any;
}): Middle<Context> => {
  return async (ctx, next) => {
    ctx.input = opts.parse(ctx.input);
    await next();
    ctx.output = opts.stringify(ctx.output);
    isWsContext(ctx) ? ctx.ws.send(ctx.output) : ctx.send(200, ctx.output);
  };
};
export const logger: Middle<Context> = async (ctx, next) => {
  await next();
  log.info(
    {
      req: {
        method: ctx.req.method,
        url: ctx.req.url,
        headers: ctx.req.headers,
        input: ctx.input,
      },
      res: isWsContext(ctx)
        ? { output: ctx.output }
        : {
            statusCode: ctx.res?.statusCode,
            // headers: ctx.res?.getHeaders(),
            output: ctx.output,
          },
    },
    'Request OK',
  );
};
export const catcher: Middle<Context> = async (ctx, next) => {
  try {
    await next();
  } catch (err) {
    log.error(err);
    ctx.output = o('fail', 'unknown error');
  }
};

// const SECRET_KEY = 'secret';
// const NONCE_EXPIRE = 5 * 60;
// export const antiSpider: Middleware = async (ctx, next) => {
//   const {
//     'x-timestamp': timestamp,
//     'x-nonce': nonce,
//     'x-signature': signature,
//   } = ctx.request.headers as Record<string, string>;
//   if (!timestamp || !nonce || !signature) {
//     throw new SystemError('Request is invalid');
//   }

//   // 检查时间戳
//   const now = Date.now();
//   if (Math.abs(now - parseInt(timestamp) * 1000) > 5 * 60 * 1000) {
//     throw new SystemError('Timestamp is invalid');
//   }
//   // 检查随机数
//   const nonceStore = await redis.get(nonce);
//   if (nonceStore) {
//     throw new SystemError('Nonce is used');
//   } else {
//     await redis.set(nonce, 1, { EX: NONCE_EXPIRE });
//   }
//   // 检查签名
//   const baseString = map({ timestamp, nonce }, (v, k) => `${k}=${v}`).join('&');
//   const _hash = crypto
//     .createHmac('sha256', SECRET_KEY)
//     .update(baseString)
//     .digest('hex');

//   // if (hash !== signature) {
//   //   throw new SystemException("Signature is invalid");
//   // }
//   await next();
// };
