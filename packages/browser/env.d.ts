/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/vue" />
import type { HTMLAttributes } from '@vue/runtime-dom';
import type { Role } from 'shared/enum';
import 'vue-router';
import 'vue/jsx-runtime';

declare module 'vue-router' {
  interface RouteMeta {
    /**按钮样式 */
    btnProps?: {
      tip: string;
      icon: string;
      /**顺序 */
      order?: number;
      /**组顺序 */
      groupOrder?: number;
      hideOn?: 'pc' | 'mobile';
    };
    /**用户权限 */
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
