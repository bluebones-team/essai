import { mdiAccountCircleOutline } from '@mdi/js';
import type { Component } from 'vue';
import {
  KeepAlive,
  computed,
  defineComponent,
  h,
  reactive,
  withDirectives,
} from 'vue';
import { RouterView, useRouter } from 'vue-router';
import { useDisplay } from 'vuetify';
import { VApp } from 'vuetify/components/VApp';
import { VBadge } from 'vuetify/components/VBadge';
import { VBottomNavigation } from 'vuetify/components/VBottomNavigation';
import { VSpacer } from 'vuetify/components/VGrid';
import { VIcon } from 'vuetify/components/VIcon';
import { VLayout } from 'vuetify/components/VLayout';
import { VNavigationDrawer } from 'vuetify/components/VNavigationDrawer';
import { VTab, VTabs } from 'vuetify/components/VTabs';
import {
  VSlideXReverseTransition,
  VSlideXTransition,
  VSlideYTransition,
} from 'vuetify/components/transitions';
import { Tooltip } from 'vuetify/directives';
import { Pic } from '~/components/pic';
import { messages, setting, snackbar, udata } from '~/ts/state';
import { useTheme } from './ts/hook';

type NavTabProps = Props<typeof NavTab>;
const NavTab = defineComponent(
  (p: {
    show: boolean;
    path?: string;
    tip: string;
    icon?: string;
    badge?: boolean;
    slot?: Component;
    style?: string;
  }) => {
    const { mobile } = useDisplay();
    return () =>
      withDirectives(
        <VTab
          v-show={p.show}
          class={['justify-center', !mobile.value ? 'w-100' : 'h-100']}
          rounded={0}
          to={p.path}
          icon
        >
          {p.slot ? (
            h(p.slot)
          ) : p.badge ? (
            <VBadge dot={p.badge} color="error">
              <VIcon icon={p.icon} />
            </VBadge>
          ) : (
            <VIcon icon={p.icon} />
          )}
        </VTab>,
        //@ts-ignore
        [mobile.value ? [] : [Tooltip, p.tip, 'right']],
      );
  },
);

function useNavRoutes() {
  const routes = useRouter().getRoutes();
  return (routes as NavRoute[])
    .filter((e) => e.path.lastIndexOf('/') === 0 && !!e.meta?.nav)
    .toSorted(
      (a, b) => (a.meta.nav.order ?? Infinity) - (b.meta.nav.order ?? Infinity),
    );
}
function useNavTabs() {
  const { mobile } = useDisplay();
  const navRoutes = useNavRoutes();
  return reactive({
    top: computed<NavTabProps[]>(() =>
      navRoutes.map(({ path, meta }) => ({
        show:
          (meta.need?.role === void 0 ||
            meta.need.role === setting.display.role) &&
          meta.nav.hideOn !== (mobile.value ? 'mobile' : 'pc'),
        path,
        badge:
          meta.nav.tip === '消息'
            ? messages.value.some((e) => !e.has_read)
            : false,
        ...meta.nav,
      })),
    ),
    down: computed<NavTabProps[]>(() => [
      {
        show: true,
        path: '/setting',
        ...(udata.value
          ? {
              tip: udata.value.name,
              slot: () => (
                <Pic {...{ size: 28, src: udata.value?.face ?? '' }} />
              ),
            }
          : {
              tip: '登录/注册',
              icon: mdiAccountCircleOutline,
            }),
      },
    ]),
  });
}

const NavigationDrawer = defineComponent(() => {
  const navBtns = useNavTabs();
  return () => (
    <VNavigationDrawer border={1} permanent rail>
      <VTabs class="h-100" direction="vertical">
        <VSlideXReverseTransition group hideOnLeave>
          {navBtns.top.map((p) => (
            <NavTab key={p.tip} {...p} />
          ))}
          <VSpacer key="?" />
          {navBtns.down.map((p) => (
            <NavTab key={p.tip} {...p} />
          ))}
        </VSlideXReverseTransition>
      </VTabs>
    </VNavigationDrawer>
  );
});
const NavigationBottom = defineComponent(() => {
  const navBtns = useNavTabs();
  return () => (
    <VBottomNavigation horizontal>
      <VTabs class="w-100 h-100" direction="horizontal" grow>
        <VSlideYTransition group hideOnLeave>
          {navBtns.top.concat(navBtns.down).map((p) => (
            <NavTab key={p.tip} {...p} />
          ))}
        </VSlideYTransition>
      </VTabs>
    </VBottomNavigation>
  );
});
const RouterPage = defineComponent(() => {
  const { mobile } = useDisplay();
  const Transition = computed(() =>
    mobile.value ? VSlideYTransition : VSlideXTransition,
  );
  return () => (
    <RouterView
      v-slots={
        {
          default: ({ Component, route }) => [
            Component && (
              <Transition.value appear mode="out-in">
                <KeepAlive>
                  {h(Component, { key: route.matched[0].path })}
                </KeepAlive>
              </Transition.value>
            ),
          ],
        } satisfies Slots<typeof RouterView>
      }
    />
  );
});

export const App = defineComponent(() => {
  const { mobile } = useDisplay();
  const theme = useTheme();
  return () => (
    <VApp
      class="h-screen"
      theme={theme.app}
      // onContextmenu={(e) => e.preventDefault()}
    >
      <VLayout>
        <snackbar.Comp />
        {mobile.value ? <NavigationBottom /> : <NavigationDrawer />}
        <RouterPage />
      </VLayout>
    </VApp>
  );
});
