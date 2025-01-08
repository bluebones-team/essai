import 'dotenv/config';
import helmet from 'helmet';
import { createServer } from 'http';
import { env } from 'shared';
import { json_decoder, json_encoder, Server } from 'shared/router';
import { apiPrefix, devPort } from 'shared/router/config.json';
import WebSocket from 'ws';
import { catcher, logger, middleAdaptor, sender } from './middle';
import { routerMiddle } from './router';
import { log } from './util';

const app = new Server();
app.in.use(catcher).use(json_decoder('input')).use(routerMiddle);
app.out
  .use(logger)
  .use(middleAdaptor(helmet()))
  .use(json_encoder('output'))
  .use(sender);
const handler = app.createHandler();

function extractApiPath(path: string) {
  return path.split(apiPrefix)[1] ?? path;
}
const port = env('PORT', devPort);
const server = createServer(async (req, res) => {
  const path = req.url;
  if (!path) return log.error(path, 'http req.url is empty');
  handler({
    req,
    res,
    //@ts-ignore
    path: extractApiPath(path),
    //@ts-ignore
    input: await new Promise<string>((resolve) => {
      let data = '';
      req.on('data', (chunk) => (data += chunk)).on('end', () => resolve(data));
    }),
  });
})
  .on('error', (err) => log.error('http server error', err))
  .listen(port, () => console.info(`Listen: http://localhost:${port}`));
new WebSocket.Server({ server })
  .on('connection', (ws, req) => {
    ws.on('message', (data) => {
      const path = req.url;
      if (!path) return log.error(path, 'ws req.url is empty');
      handler({
        req,
        ws,
        //@ts-ignore
        path: extractApiPath(path),
        //@ts-ignore
        input: data.toString(),
      });
    }).on('error', (err) => log.error('ws connection error', err));
  })
  .on('error', (err) => log.error('ws server error', err))
  .on('listening', () => console.info(`Listen: ws://localhost:${port}`));
