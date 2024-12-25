import { each } from 'shared';
import { createClient, getApiURL } from 'shared/router';

const accountInfo = wx.getAccountInfoSync();
const envVersion = accountInfo.miniProgram.envVersion;

const host = getApiURL(envVersion === 'develop');
const wsHost = getApiURL(envVersion === 'develop', 'ws');
export const c = createClient({
  send(ctx) {
    const meta = ctx.api.meta;
    const { type } = meta;
    if (type === 'ws') return;
    fetch(`${host}/${ctx.path}`, {
      method: type,
      headers: {
        Authorization: meta.token && wx.getStorageSync(meta.token),
        // 'Content-Type': 'application/json',
      },
      body: ctx.input as string,
      signal: ctx.signal,
    })
      .then((r) => r.json())
      .then(ctx.onData, ctx.onError);
  },
  error(msg, ...e) {
    wx.showToast({ title: msg, icon: 'error' });
    console.error(e);
  },
  setToken: (d) => each(d, (v, k) => wx.setStorageSync(k, v)),
});
