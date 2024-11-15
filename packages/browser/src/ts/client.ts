import { createClient, getApiURL } from 'shared/router';
import { storage } from '~/ts/state';
import { error } from './util';

const host = getApiURL(import.meta.env.DEV);
const wsHost = getApiURL(import.meta.env.DEV, 'ws');
//@ts-ignore
export const c = createClient({
  send(ctx) {
    const { meta } = ctx;
    if (meta.type === 'ws') return;
    fetch(`${host}/${ctx.path}`, {
      method: meta.type,
      headers: {
        Authorization: meta.token && storage.get(meta.token),
        // 'Content-Type': 'application/json',
      },
      body: ctx.data as string,
      signal: ctx.signal,
    })
      .then((r) => r.json())
      .then(ctx.onData, ctx.onError);
  },
  error,
  token: {
    get: (k) => storage.get(k),
    set: (d) => storage.setToken(d),
  },
});
if (import.meta.env.DEV) Object.assign(window, { c });
