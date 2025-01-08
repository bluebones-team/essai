import { mdiPaletteOutline } from '@mdi/js';
import { Role, Theme } from 'shared/data';
import { computed, defineComponent } from 'vue';
import { VBtn } from 'vuetify/components/VBtn';
import { VBtnToggle } from 'vuetify/components/VBtnToggle';
import { SectionGroup } from '~/components/section-group';
import { useTheme } from '~/ts/hook';
import { setting, udata } from '~/ts/state';
import { definePageComponent } from '~/ts/util';
import { comp } from './components/util';

const RolePanel = defineComponent(() => {
  const theme = useTheme();
  return () =>
    udata.value?.recruiter ? (
      <VBtnToggle
        v-model={setting.display.role}
        mandatory
        rounded
        border
        v-slots={{
          default: () =>
            Role.items.map((e) => <VBtn {...e} theme={theme.app} />),
        }}
      />
    ) : (
      <VBtn text="成为招募者" onClick={() => {}} />
    );
});

export const route: LooseRouteRecord = {
  meta: {
    nav: {
      tip: '应用配置',
      icon: mdiPaletteOutline,
      order: 1,
    },
  },
};
export default definePageComponent(import.meta.url, () => {
  const sections = computed(() => {
    return [
      {
        title: '界面',
        items: [
          {
            title: '主题',
            horizontal: true,
            comp: () => (
              <VBtnToggle
                v-model={setting.display.theme}
                mandatory
                rounded
                border
                v-slots={{
                  default: () => Theme.items.map((e) => <VBtn {...e} />),
                }}
              />
            ),
          },
          { title: '角色', horizontal: true, comp: RolePanel },
        ],
      },
      {
        title: '权限',
        items: [
          comp.switch(
            [setting.permission, 'geolocation'],
            '位置',
            '用于获取附近的正在招募的项目',
          ),
          comp.switch(
            [setting.permission, 'notification'],
            '系统通知',
            '将消息推送到系统通知栏',
          ),
        ],
      },
    ];
  });
  return () => <SectionGroup {...{ sections: sections.value }} />;
});
