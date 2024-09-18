import { applyWSSHandler } from '@trpc/server/adapters/ws';
import Koa from 'koa';
import koaBody from 'koa-body';
import helmet from 'koa-helmet';
import koaJson from 'koa-json';
import { WebSocketServer } from 'ws';
import { catcher, cors, log } from './middleware';
import { appRouter, routes } from './routes';

const port = process.env.PORT || 3001;
const server = new Koa()
  .use(koaBody())
  .use(koaJson())
  .use(helmet())
  .use(cors)
  .use(catcher)
  .use(log)
  // .use(antiSpider)
  .use(routes)
  .listen(port, () => {
    console.info(`Listen: http://localhost:${port}`);
  });

applyWSSHandler({
  wss: new WebSocketServer({ server }),
  router: appRouter,
  //@ts-ignore
  createContext: (e) => e,
});
