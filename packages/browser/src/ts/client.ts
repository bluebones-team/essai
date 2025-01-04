import { createClient, getApiURL } from 'shared/router';
import { storage } from '~/ts/state';
import { error } from './util';

const host = getApiURL(import.meta.env.DEV);
const wsHost = getApiURL(import.meta.env.DEV, 'ws');
//@ts-ignore
export const c = createClient({
  send(ctx) {
    const { meta } = ctx.api;
    if (meta.type === 'ws') {
      const ws = new WebSocket(`${wsHost}${ctx.path}`);
      ws.addEventListener('open', (event) => {
        ws.send(ctx.input as string);
      });
      ws.addEventListener('message', (event) => {
        ctx.onData(event.data);
      });
      ws.addEventListener('error', (event) => {
        ctx.onError(event);
      });
    } else {
      fetch(`${host}${ctx.path}`, {
        method: meta.type,
        headers: {
          Authorization: meta.token && storage.get(meta.token),
          // 'Content-Type': 'application/json',
        },
        body: ctx.input as string,
        signal: ctx.signal,
      })
        .then((res) => res.text())
        //@ts-ignore
        .then(ctx.onData, ctx.onError);
    }
  },
  error,
  setToken: (d) => storage.setToken(d),
});
if (import.meta.env.DEV) Object.assign(window, { c });
