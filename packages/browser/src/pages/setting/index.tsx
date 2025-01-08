import { ref } from 'vue';
import { RouterView, useRoute, useRouter } from 'vue-router';
import { useDisplay } from 'vuetify';
import { VAppBar, VAppBarNavIcon } from 'vuetify/components/VAppBar';
import { VMain } from 'vuetify/components/VMain';
import { VNavigationDrawer } from 'vuetify/components/VNavigationDrawer';
import { List } from '~/components/list';
import { definePageComponent } from '~/ts/util';

function useNavItems() {
  const routes = useRouter().getRoutes();
  const navRoutes = routes.filter(
    (e) => e.path.startsWith('/setting/') && !!e.meta?.nav,
  ) as NavRoute[];
  if (navRoutes.length === 0) {
    console.warn('设置页面: 找不到导航子路由');
  }
  return navRoutes
    .toSorted((a, b) => (a.meta.nav.order ?? 0) - (b.meta.nav.order ?? 0))
    .map(({ path, meta }) => ({
      key: path,
      to: path,
      title: meta!.nav!.tip,
      prependIcon: meta!.nav!.icon,
    }));
}

export const route: LooseRouteRecord = {
  redirect(to) {
    const [norm] = to.matched;
    if (norm.path !== '/setting') return '/404';
    const subRoute = norm.children.find((raw) => {
      const p = raw.meta?.nav;
      return p && p.order === 1;
    });
    return subRoute ? norm.path + '/' + subRoute.path : '/404';
  },
};
export default definePageComponent(import.meta.url, function () {
  const { mobile } = useDisplay();
  const showNav = ref(!mobile.value);
  const route = useRoute();
  const navItems = useNavItems();
  return () => (
    <div class="v-main">
      {mobile.value && (
        <VAppBar
          title={route.meta.nav?.tip}
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
});
