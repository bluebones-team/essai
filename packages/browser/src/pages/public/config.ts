import { Role } from 'shared/enum';
import { mdiAccountPlusOutline } from '@mdi/js';
import type { RouteMeta } from 'vue-router';

export default {
  meta: {
    btnProps: {
      tip: '报名',
      icon: mdiAccountPlusOutline,
      order: 2,
    },
    need: {
      login: false,
      role: Role.Participant._value,
    },
  } satisfies RouteMeta,
};
