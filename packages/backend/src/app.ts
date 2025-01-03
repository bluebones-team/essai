import 'dotenv/config';
import Koa from 'koa';
import helmet from 'koa-helmet';
import { env } from 'shared';
import { devPort } from 'shared/router';
import { catcher, cors, convert, log } from './middleware';
import { routerMiddle } from './routes';
import WebSocket from 'ws';

const port = env('PORT', '' + devPort);
const app = new Koa()
  .use(log)
  .use(cors())
  .use(helmet())
  .use(convert())
  .use(catcher)
  // .use(antiSpider)
  .use(routerMiddle);
const server = app.listen(port, () => {
  console.info(`Listen: http://localhost:${port}`);
});
new WebSocket.Server({ server }).on('connection', (ws) => {
  console.log('ws connected', ws.url);
  ws.on('message', (message) => {
    console.log(`Recv: ${message}`);
  });
});
