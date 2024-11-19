import type { Middleware } from 'koa';
import pinoLogger from 'koa-pino-logger';
import type { PrettyOptions } from 'pino-pretty';
import { env, pick } from 'shared';
import { a_json, b_json } from 'shared/middle';

/**@see https://github.com/pinojs/pino/blob/main/docs/api.md#options */
export const log = pinoLogger({
  level: env('NODE_ENV') === 'development' ? 'debug' : 'info',
  serializers: {
    req: (req) => ({
      ...pick(req, ['remoteAddress', 'remotePort', 'method', 'url']),
      // headers: pick(req.headers, ['origin', 'referer']),
    }),
    res: (res) => pick(res, ['statusCode']),
  },
  transport: {
    targets: [
      {
        target: 'pino-pretty',
        level: 'debug',
        /**@see https://github.com/pinojs/pino-pretty */
        options: {
          translateTime: 'SYS:standard',
          messageFormat: ['{req.method} {req.url}', '{msg}'].join(' - '),
          singleLine: true,
          // hideObject: true,
        } satisfies PrettyOptions,
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

declare module 'koa' {
  interface ExtendableContext {
    input: unknown;
    output: unknown;
  }
}
export const convert = (): Middleware => {
  return async (ctx, next) => {
    const text = await new Promise<string>((resolve) => {
      let data = '';
      ctx.req
        .on('data', (chunk) => (data += chunk))
        .on('end', () => resolve(data));
    });
    ctx.input = b_json.convert(text);
    await next();
    ctx.body = a_json.convert(ctx.output);
  };
};

/**@see https://developer.mozilla.org/zh-CN/docs/Web/HTTP/CORS */
export const cors = (): Middleware => (ctx, next) => {
  ctx.set('Access-Control-Allow-Origin', '*');
  ctx.set('Access-Control-Allow-Credentials', 'true');
  ctx.set('Content-Type', 'application/json;charset=utf-8');
  if (ctx.method === 'OPTIONS') {
    ctx.set('Access-Control-Allow-Methods', ['POST', 'GET', 'OPTIONS']);
    ctx.set('Access-Control-Allow-Headers', ['Authorization', 'Content-Type']);
    ctx.set('Access-Control-Max-Age', '3600');
    ctx.status = 204;
    return;
  }
  return next();
};

export const catcher: Middleware = (ctx, next) =>
  next().catch((err) => {
    ctx.status = 500;
    ctx.log.error(err);
  });

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
