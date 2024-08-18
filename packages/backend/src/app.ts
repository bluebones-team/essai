import { applyWSSHandler } from '@trpc/server/adapters/ws';
import Koa from 'koa';
import koaBody from 'koa-body';
import helmet from 'koa-helmet';
import koaJson from 'koa-json';
import { WebSocketServer } from 'ws';
import { cors } from '~/middleware/cors';
import { exceptionHandler } from '~/middleware/exceptionHandler';
import { koaLogger } from '~/middleware/logger';
import { appRouter, routes } from '~/routes';

const port = process.env.PORT || 3001;
const server = new Koa()
  .use(koaBody())
  .use(koaJson())
  .use(helmet())
  .use(koaLogger)
  .use(cors)
  .use(exceptionHandler)
  //.use(antiReHxr)
  .use(routes)
  .listen(port, () => {
    console.info(`server run on: http://localhost:${port}`);
  });

applyWSSHandler({
  wss: new WebSocketServer({ server }),
  router: appRouter,
  //@ts-ignore
  createContext: (e) => e,
});
