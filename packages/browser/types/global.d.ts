import type { FunctionalComponent } from 'vue';
import type { RouteRecord, RouteRecordRaw, RouteMeta } from 'vue-router';

interface Constructor<P, S> {
  __isFragment?: never;
  __isTeleport?: never;
  __isSuspense?: never;
  new (...args: any[]): { $props: P; $slots: S };
}
type ComponentLike<P, S extends Record<string, any>> =
  | FunctionalComponent<P, any, S>
  | { $props: P; $slots: S }
  | Constructor<P, S>;

type NativeType = null | number | string | boolean | symbol | Function;
type InferDefault<P, T> =
  | ((props: P) => T & {})
  | (T extends NativeType ? T : never);

declare global {
  /**获取 Props */
  type Props<T> =
    T extends ComponentLike<infer P, infer S>
      ? P & Record<string, unknown>
      : never;
  /**获取 Slots */
  type Slots<T> =
    T extends ComponentLike<infer P, infer S> ? Partial<S> : never;

  /**ModelProps */
  type ModelProps<T, N extends string = 'modelValue'> = { [P in N]?: T } & {
    [P in `onUpdate:${N}`]?: (value: T) => void;
  };
  type InferDefaults<T> = { [K in keyof T]?: InferDefault<T, T[K]> };

  type LooseRouteRecord = Partial<RouteRecord>;
  type NavRoute = RouteRecordRaw & { meta: RequiredByKey<RouteMeta, 'nav'> };
}
