import 'dotenv/config';
import helmet from 'helmet';
import { createServer } from 'http';
import { env, Onion } from 'shared';
import { a_json, b_json, devPort } from 'shared/router';
import WebSocket from 'ws';
import { catcher, convert, cors, logger, middleAdaptor } from './middle';
import { routerMiddle } from './router';
import { createContext, log } from './util';

const sharedHandler = new Onion<Context>()
  .use(convert({ stringify: a_json.convert, parse: b_json.convert }))
  .use(logger)
  .use(catcher)
  .use(routerMiddle)
  .compose();
const httpHandler = new Onion<HttpContext>()
  .use(cors)
  .use(middleAdaptor(helmet()))
  .use(sharedHandler)
  .compose();
const wsHandler = new Onion<WsContext>().use(sharedHandler).compose();

const port = env('PORT', '' + devPort);
const server = createServer(async (req, res) =>
  httpHandler(await createContext.http(req, res)),
)
  .on('error', (err) => log.error('http server error', err))
  .listen(port, () => console.info(`Listen: http://localhost:${port}`));
new WebSocket.Server({ server })
  .on('connection', (ws, req) => {
    ws.on('message', (data) => wsHandler(createContext.ws(ws, req, data))).on(
      'error',
      (err) => log.error('ws connection error', err),
    );
  })
  .on('error', (err) => log.error('ws server error', err));
