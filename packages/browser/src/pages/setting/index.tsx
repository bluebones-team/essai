import { defineComponent, ref } from 'vue';
import {
  RouterView,
  useRoute,
  type RouteMeta,
  type RouteRecordRaw,
} from 'vue-router';
import { useDisplay } from 'vuetify';
import { VAppBar, VAppBarNavIcon } from 'vuetify/components/VAppBar';
import { VMain } from 'vuetify/components/VMain';
import { VNavigationDrawer } from 'vuetify/components/VNavigationDrawer';
import { List } from '~/components/list';
import { routes } from '~/ts/route';
import { groupSort } from '~/ts/util';

const navRoutes =
  routes
    .find((e) => e.path === '/setting')
    ?.children?.filter(
      (
        e,
      ): e is RouteRecordRaw & {
        meta: { btnProps: NonNullable<RouteMeta['btnProps']> };
      } => !!e.meta?.btnProps,
    ) ?? [];
if (navRoutes.length === 0) {
  console.warn('设置页面: 找不到导航子路由');
}
const groupName = { 0: '未知分组', 1: '应用设置', 2: '用户信息' };
const navItems = groupSort(
  navRoutes,
  (e) => e.meta.btnProps.groupOrder ?? 0,
  (e) => e.meta.btnProps.order ?? 0,
).flatMap(([groupOrder, routes]) => [
  //@ts-ignore
  { type: 'subheader', title: groupName[groupOrder] },
  ...routes.map(({ path, meta }) => ({
    key: path,
    to: path,
    title: meta!.btnProps!.tip,
    prependIcon: meta!.btnProps!.icon,
  })),
]);

export default defineComponent(
  function () {
    const { mobile } = useDisplay();
    const showNav = ref(!mobile.value);
    const route = useRoute();
    return () => (
      <div class="v-main">
        {mobile.value && (
          <VAppBar
            title={route.meta.btnProps?.tip}
            icon
            v-slots={{
              prepend: () => (
                <VAppBarNavIcon
                  onClick={() => {
                    showNav.value = !showNav.value;
                  }}
                />
              ),
            }}
          ></VAppBar>
        )}
        <VNavigationDrawer v-model={showNav.value}>
          <List type="nav" items={navItems} />
        </VNavigationDrawer>
        <VMain class="h-100 overflow-auto">
          <RouterView
            v-slots={
              {
                default: ({ Component, route }) => [
                  Component && (
                    // @ts-ignore
                    <Component key={route.matched[1].path} />
                  ),
                ],
              } satisfies Slots<typeof RouterView>
            }
          ></RouterView>
        </VMain>
      </div>
    );
  },
  { name: 'Setting' },
);
