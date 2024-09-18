/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/vue" />
/// <reference types="shared/types" />

import type { HTMLAttributes } from '@vue/runtime-dom';
import type { Role } from 'shared/data';
import 'vue-router';
import 'vue/jsx-runtime';

declare module 'vue-router' {
  interface RouteMeta {
    nav?: {
      tip: string;
      icon: string;
      order?: number;
      groupOrder?: number;
      hideOn?: 'pc' | 'mobile';
    };
    need?: Partial<{
      login: boolean;
      role: Role;
    }>;
  }
}
declare module 'vue/jsx-runtime' {
  namespace JSX {
    interface IntrinsicAttributes
      extends Pick<HTMLAttributes, 'class' | 'style' | 'onContextmenu'>,
        Record<string, unknown> {}
  }
}
