import 'dotenv/config';
import Koa from 'koa';
import helmet from 'koa-helmet';
import { env } from 'shared';
import { devPort } from 'shared/router';
import { catcher, cors, body, log } from './middleware';
import { router } from './routes';

const port = env('PORT', devPort);
const app = new Koa()
  .use(log)
  .use(catcher)
  .use(body())
  .use(cors())
  .use(helmet())
  // .use(antiSpider)
  .use(router.routes())
  .use(router.allowedMethods())
  .listen(port, () => {
    console.info(`Listen: http://localhost:${port}`);
  });
