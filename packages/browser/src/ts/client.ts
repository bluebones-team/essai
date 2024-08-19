import {
  createTRPCProxyClient,
  createWSClient,
  httpBatchLink,
  splitLink,
  wsLink,
} from '@trpc/client';
import { createClient, getApiURL, type CustomContext } from 'shared/client';
import { snackbar, storage } from '~/ts/state';

export const client = createClient(
  createTRPCProxyClient({
    links: [
      splitLink({
        condition(op) {
          return op.type === 'subscription';
        },
        true: wsLink({
          client: createWSClient({
            url: getApiURL(import.meta.env.DEV, 'ws'),
          }),
        }),
        false: httpBatchLink({
          url: getApiURL(import.meta.env.DEV),
          headers({ opList }) {
            const ctx: CustomContext = opList[0].context;
            return {
              Authorization: ctx.token,
            };
          },
        }),
      }),
    ],
  }),
  {
    showTip(e) {
      snackbar.show(e);
    },
    token: {
      get(k) {
        return storage.get(k);
      },
      set(d) {
        storage.setToken(d);
      },
    },
  },
);
