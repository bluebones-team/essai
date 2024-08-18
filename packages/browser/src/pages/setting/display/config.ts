import { mdiPaletteOutline } from '@mdi/js';
import type { RouteMeta } from 'vue-router';

export default {
  meta: {
    btnProps: {
      tip: '外观',
      icon: mdiPaletteOutline,
      order: 1,
      groupOrder: 1,
    },
  } satisfies RouteMeta,
};
