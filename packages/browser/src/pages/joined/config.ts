import { Role } from 'shared/enum';
import type { RouteMeta } from 'vue-router';
import { mdiRun } from '@mdi/js';

export default {
  meta: {
    btnProps: {
      tip: '正在参加',
      icon: mdiRun,
      order: 3,
    },
    need: {
      login: true,
      role: Role.Participant._value,
    },
  } satisfies RouteMeta,
};
