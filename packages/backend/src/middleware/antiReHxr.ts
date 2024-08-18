import crypto from 'crypto';
import type { Middleware } from 'koa';
import redis from '~/client/redis';
import { SystemError } from '~/error';

const SECRET_KEY = 'secret';
const NONCE_EXPIRE = 5 * 60;

export const antiReHxr: Middleware = async (ctx, next) => {
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
  const sortedParams: { [key: string]: string } = { timestamp, nonce };
  const sortedKeys = Object.keys(sortedParams).sort();
  const baseString = sortedKeys
    .map((key) => `${key}=${sortedParams[key]}`)
    .join('&');
  const _hash = crypto
    .createHmac('sha256', SECRET_KEY)
    .update(baseString)
    .digest('hex');

  // if (hash !== signature) {
  //   throw new SystemException("Signature is invalid");
  // }
  await next();
};
