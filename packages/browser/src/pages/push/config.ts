import { Role } from 'shared/enum';
import { mdiSendOutline } from '@mdi/js';
import type { RouteMeta } from 'vue-router';

export default {
  meta: {
    btnProps: {
      tip: '推送',
      icon: mdiSendOutline,
      order: 5,
    },
    need: {
      login: true,
      role: Role.Recruiter._value,
    },
  } satisfies RouteMeta,
};
