import { Role } from 'shared/enum';
import { mdiFileMultipleOutline } from '@mdi/js';
import type { RouteMeta } from 'vue-router';

export default {
  meta: {
    btnProps: {
      tip: '项目管理',
      icon: mdiFileMultipleOutline,
      order: 4,
    },
    need: {
      login: true,
      role: Role.Recruiter._value,
    },
  } satisfies RouteMeta,
};
