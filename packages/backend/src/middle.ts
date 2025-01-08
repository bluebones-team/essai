import type { IncomingMessage, ServerResponse } from 'http';
import { type Middle } from 'shared';
import type { Server } from 'shared/router';
import { log, o } from './util';

export function middleAdaptor(
  middle: (req: IncomingMessage, res: ServerResponse, next: () => void) => void,
) {
  const name = `${middle.name}Adaptor`;
  return {
    [name]: ((ctx, next) =>
      ctx.res
        ? middle(ctx.req, ctx.res, next)
        : next()) as Middle<Server.Context>,
  }[name];
}

export const logger: Middle<Server.Context> = async (ctx, next) => {
  log.info(
    {
      req: {
        method: ctx.req.method,
        url: ctx.req.url,
        // headers: ctx.req.headers,
        input: ctx.input,
      },
      res: ctx.res && {
        output: ctx.output,
        statusCode: ctx.res.statusCode,
      },
      ws: ctx.ws && {
        bufferedAmount: ctx.ws.bufferedAmount,
      },
    },
    'request',
  );
  next();
};
export const catcher: Middle<Server.Context> = async (ctx, next) => {
  try {
    await next();
  } catch (err) {
    const output = o.error('server error', err);
    ctx.send(output);
  }
};
export const sender: Middle<Server.Context> = (ctx, next) => {
  const { output } = ctx;
  if (typeof output !== 'string')
    return log.error(output, 'output is not string');
  ctx.res?.end(output);
  ctx.ws?.send(output);
};
