import { mdiBellOutline } from '@mdi/js';
import type { RouteMeta } from 'vue-router';

export default {
  meta: {
    btnProps: {
      tip: '消息',
      icon: mdiBellOutline,
      order: 6,
    },
    need: { login: true },
  } satisfies RouteMeta,
};
