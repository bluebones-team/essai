import crypto from 'crypto';
import type { Middleware } from 'koa';
import pinoLogger from 'koa-pino-logger';
import type { PrettyOptions } from 'pino-pretty';
import { map, pick } from 'shared';
import redis from '~/client/redis';
import { SystemError } from './error';

export const log: Middleware = pinoLogger({
  level: process.env.NODE_ENV === 'product' ? 'info' : 'debug',
  customReceivedMessage(req, res) {
    return `Request: ${req.headers.origin} ${req.method} ${req.url}`;
  },
  serializers: {
    msg: (msg) => msg,
    req: (req) => ({
      ...pick(req, ['remoteAddress', 'remotePort', 'method', 'url']),
      headers: pick(req.headers, ['origin', 'referer', 'user-agent']),
    }),
    res: (res) => pick(res, ['statusCode']),
  },
  transport: {
    targets: [
      {
        target: 'pino-pretty',
        level: 'debug',
        options: {
          destination: 1,
          hideObject: true,
          translateTime: 'SYS:standard',
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

/**@see https://developer.mozilla.org/zh-CN/docs/Web/HTTP/CORS */
export const cors: Middleware = async (ctx, next) => {
  ctx.set('Access-Control-Allow-Origin', '*');
  ctx.set('Access-Control-Allow-Credentials', 'true');
  ctx.set('Content-Type', 'application/json;charset=utf-8');
  if (ctx.method === 'OPTIONS') {
    ctx.set('Access-Control-Allow-Methods', ['POST', 'GET', 'OPTIONS']);
    ctx.set('Access-Control-Allow-Headers', ['Authorization', 'Content-Type']);
    ctx.set('Access-Control-Max-Age', '3600'); // 1h 内不需要再发送预检请求
    ctx.status = 204;
    return;
  }
  await next();
};

export const catcher: Middleware = (ctx, next) =>
  next().catch((err) => {
    ctx.status = 500;
    ctx.log.error(err);
    if (err instanceof SystemError) {
      ctx.body = err.message;
    } else {
      ctx.body = 'Uncaught Error';
    }
  });

const SECRET_KEY = 'secret';
const NONCE_EXPIRE = 5 * 60;
export const antiSpider: Middleware = async (ctx, next) => {
  const {
    'x-timestamp': timestamp,
    'x-nonce': nonce,
    'x-signature': signature,
  } = ctx.request.headers as Record<string, string>;
  if (!timestamp || !nonce || !signature) {
    throw new SystemError('Request is invalid');
  }

  // 检查时间戳
  const now = Date.now();
  if (Math.abs(now - parseInt(timestamp) * 1000) > 5 * 60 * 1000) {
    throw new SystemError('Timestamp is invalid');
  }
  // 检查随机数
  const nonceStore = await redis.get(nonce);
  if (nonceStore) {
    throw new SystemError('Nonce is used');
  } else {
    await redis.set(nonce, 1, { EX: NONCE_EXPIRE });
  }
  // 检查签名
  const baseString = map({ timestamp, nonce }, (v, k) => `${k}=${v}`).join('&');
  const _hash = crypto
    .createHmac('sha256', SECRET_KEY)
    .update(baseString)
    .digest('hex');

  // if (hash !== signature) {
  //   throw new SystemException("Signature is invalid");
  // }
  await next();
};
