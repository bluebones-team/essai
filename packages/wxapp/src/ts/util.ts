import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';
import { each } from 'lodash-es';
import { createClient, getApiURL } from 'shared/client';

const accountInfo = wx.getAccountInfoSync();
const envVersion = accountInfo.miniProgram.envVersion;
export const client = createClient(
  createTRPCProxyClient({
    links: [
      //@ts-ignore
      httpBatchLink({
        url: getApiURL(envVersion === 'develop'),
        ...(() => {
          let task: WechatMiniprogram.RequestTask;
          return {
            fetch: (input, init) =>
              new Promise((resolve, reject) => {
                task = wx.request({
                  //@ts-ignore
                  url: input.url ? input.url : input + '',
                  //@ts-ignore
                  method: init?.method?.toUpperCase() || 'GET',
                  //@ts-ignore
                  data: init?.body,
                  header: init?.headers,
                  success: (res) =>
                    resolve({
                      async json() {
                        return res.data;
                      },
                    }),
                  fail: reject,
                });
              }),
            AbortController() {
              return { abort: () => task.abort() };
            },
          };
        })(),
      }),
    ],
  }),
  {
    showTip(e) {
      wx.showToast({
        title: e.text,
        icon: e.color === 'success' ? 'success' : 'none',
      });
    },
    token: {
      get(k) {
        return wx.getStorageSync(k);
      },
      set(d) {
        each(d, (v, k) => wx.setStorageSync(k, v));
      },
    },
  },
);
