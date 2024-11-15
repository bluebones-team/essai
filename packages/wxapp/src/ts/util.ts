import { each } from 'shared';
import { createClient, getApiURL } from 'shared/router';

const accountInfo = wx.getAccountInfoSync();
const envVersion = accountInfo.miniProgram.envVersion;

const host = getApiURL(envVersion === 'develop');
const wsHost = getApiURL(envVersion === 'develop', 'ws');
export const c = createClient({
  send(d) {
    const type = d.meta.type;
    if (type === 'ws') return;
    fetch(`${host}/${d.path}`, {
      method: type,
      headers: {
        Authorization: d.token,
        // 'Content-Type': 'application/json',
      },
      body: JSON.stringify(d.data),
    })
      .then((r) => r.json())
      .then(d.onData, d.onError);
  },
  error: console.error,
  showTip: (e) =>
    wx.showToast({
      title: e.text,
      icon: e.color === 'success' ? 'success' : 'none',
    }),
  token: {
    get: (k) => wx.getStorageSync(k),
    set: (d) => each(d, (v, k) => wx.setStorageSync(k, v)),
  },
});
