import type { Middleware } from 'koa';

/**@see https://developer.mozilla.org/zh-CN/docs/Web/HTTP/CORS */
export const cors: Middleware = async (ctx, next) => {
  console.log(ctx.header.origin);

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
