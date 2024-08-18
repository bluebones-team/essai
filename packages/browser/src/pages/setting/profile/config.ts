import { mdiAccountOutline } from '@mdi/js';
import type { RouteMeta } from 'vue-router';

export default {
  meta: {
    btnProps: {
      tip: '个人资料',
      icon: mdiAccountOutline,
      order: 1,
      groupOrder: 2,
    },
    need: { login: true },
  } satisfies RouteMeta,
};
