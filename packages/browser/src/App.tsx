import { mdiAccountCircleOutline } from '@mdi/js';
import type { Component } from 'vue';
import {
  KeepAlive,
  computed,
  defineComponent,
  h,
  reactive,
  watchEffect,
  withDirectives,
} from 'vue';
import { RouterView, type RouteRecordRaw } from 'vue-router';
import { useDisplay } from 'vuetify';
import { VApp } from 'vuetify/components/VApp';
import { VBadge } from 'vuetify/components/VBadge';
import { VBottomNavigation } from 'vuetify/components/VBottomNavigation';
import { VSpacer } from 'vuetify/components/VGrid';
import { VIcon } from 'vuetify/components/VIcon';
import { VLayout } from 'vuetify/components/VLayout';
import { VNavigationDrawer } from 'vuetify/components/VNavigationDrawer';
import { VProgressLinear } from 'vuetify/components/VProgressLinear';
import { VTab, VTabs } from 'vuetify/components/VTabs';
import {
  VScrollYTransition,
  VSlideXReverseTransition,
  VSlideYReverseTransition,
} from 'vuetify/components/transitions';
import { Tooltip } from 'vuetify/directives';
import { Pic } from '~/components/pic';
import { routes } from '~/ts/route';
import {
  messages,
  setting,
  showProgressbar,
  snackbar,
  udata,
} from '~/ts/state';
import { useTheme } from './ts/hook';

const navRoutes = routes
  .filter(
    (
      e,
    ): e is RouteRecordRaw & {
      meta: { btnProps: { order?: number } };
    } => !!e?.meta?.btnProps,
  )
  .toSorted(
    (a, b) =>
      (a.meta.btnProps.order ?? Infinity) - (b.meta.btnProps.order ?? Infinity),
  );
type NavTabProps = Props<typeof NavTab>;
const NavTab = defineComponent(
  (p: {
    show: boolean;
    path?: string;
    tip: string;
    icon?: string;
    badge?: number;
    slot?: Component;
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
            <VBadge content={p.badge} color="error">
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
const unread_message_num = computed(
  () => messages.value.filter((e) => !e.has_read).length,
);
function useNavTabs() {
  const { mobile } = useDisplay();
  return reactive({
    top: computed<NavTabProps[]>(() =>
      navRoutes.map(({ path, meta }) => ({
        show:
          (meta.need?.role === void 0 ||
            meta.need.role === setting.display.role) &&
          meta.btnProps.hideOn !== (mobile.value ? 'mobile' : 'pc'),
        path,
        badge: meta.btnProps.tip === '消息' ? unread_message_num.value : 0,
        ...meta.btnProps,
      })),
    ),
    down: computed<NavTabProps[]>(() => [
      udata.value
        ? {
            show: true,
            path: '/setting',
            tip: udata.value.name,
            slot: () => <Pic {...{ size: 28, src: udata.value?.face ?? '' }} />,
          }
        : {
            show: true,
            path: '/login',
            tip: '登录/注册',
            icon: mdiAccountCircleOutline,
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
            //@ts-ignore
            <NavTab key={p.tip} {...p} />
          ))}
          <VSpacer key="?" />
          {navBtns.down.map((p) => (
            //@ts-ignore
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
        <VSlideYReverseTransition group hideOnLeave>
          {navBtns.top.concat(navBtns.down).map((p) => (
            //@ts-ignore
            <NavTab key={p.tip} {...p} />
          ))}
        </VSlideYReverseTransition>
      </VTabs>
    </VBottomNavigation>
  );
});
const RouterPage = defineComponent(() => () => (
  <RouterView>
    {
      {
        default: ({ Component, route }) => [
          Component && (
            <VScrollYTransition appear mode="out-in">
              <KeepAlive>
                {/* @ts-ignore */}
                <Component key={route.matched[0].path} />
              </KeepAlive>
            </VScrollYTransition>
          ),
        ],
      } satisfies Slots<typeof RouterView>
    }
  </RouterView>
));

export const App = defineComponent(() => {
  const { mobile } = useDisplay();
  const theme = useTheme();
  return () => (
    <VApp
      class="h-screen"
      theme={theme.app}
      // onContextmenu={(e) => e.preventDefault()}
    >
      <snackbar.Comp />
      <VProgressLinear
        active={showProgressbar.value}
        indeterminate
        height={6}
      />
      <VLayout>
        {mobile.value ? <NavigationBottom /> : <NavigationDrawer />}
        <RouterPage />
      </VLayout>
    </VApp>
  );
});
