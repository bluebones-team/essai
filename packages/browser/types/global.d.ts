import type { Component, ComputedRef } from 'vue';
import type { RouteMeta, RouteRecord, RouteRecordRaw } from 'vue-router';

declare global {
  /**获取 Props */
  type Props<T> =
    T extends Component<{ $props: infer P }> ? P & LooseObject : never;
  /**获取 Slots */
  type Slots<T> = T extends Component<{ $slots: infer S }> ? Partial<S> : never;

  type LooseRouteRecord = Partial<RouteRecord>;
  type NavRoute = RouteRecordRaw & { meta: RequiredByKey<RouteMeta, 'nav'> };
}
