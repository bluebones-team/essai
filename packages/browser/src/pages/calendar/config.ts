import { mdiCalendar } from '@mdi/js';
import type { RouteMeta } from 'vue-router';

export default {
  meta: {
    // btnProps: {
    //   tip: '日程表',
    //   icon: mdiCalendar,
    //   order: 7,
    // },
    need: { login: true },
  } satisfies RouteMeta,
};
