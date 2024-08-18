import { mdiShieldCheckOutline } from '@mdi/js';
import type { RouteMeta } from 'vue-router';

export default {
  meta: {
    btnProps: {
      tip: '账号安全',
      icon: mdiShieldCheckOutline,
      order: 2,
      groupOrder: 2,
    },
    need: { login: true },
  } satisfies RouteMeta,
};
