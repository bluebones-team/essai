import { mdiLockOutline } from '@mdi/js';
import type { RouteMeta } from 'vue-router';

export default {
  meta: {
    btnProps: {
      tip: '隐私权限',
      icon: mdiLockOutline,
      order: 3,
      groupOrder: 2,
    },
    need: { login: true },
  } satisfies RouteMeta,
};
