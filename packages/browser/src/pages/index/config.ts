import { mdiHomeOutline } from '@mdi/js';
import type { RouteMeta } from 'vue-router';

export default {
  path: '/',
  meta: {
    btnProps: {
      tip: '主页',
      icon: mdiHomeOutline,
      order: 2,
      hideOn: 'mobile',
    },
  } satisfies RouteMeta,
};
