import { mdiPaletteOutline } from '@mdi/js';
import { Role, Theme } from 'shared/data';
import { computed, defineComponent } from 'vue';
import { VBtn } from 'vuetify/components/VBtn';
import { ItemGroup } from '~/components/item-group';
import { SectionGroup } from '~/components/section-group';
import { useTheme } from '~/ts/hook';
import { setting, udata } from '~/ts/state';
import { toAppTheme } from '~/ts/vuetify';
import { panel } from './components/util';

const ThemePanel = defineComponent(() => {
  return () => (
    <ItemGroup
      v-model={setting.display.theme}
      class="d-grid ga-4"
      style="grid-template-columns: repeat(auto-fill, minmax(250px,1fr))"
      mandatory
      items={[
        {
          value: Theme.System._value,
          comp: ({ isSelected, toggle }) => [
            <div class="position-relative" onClick={toggle}>
              {panel.content({
                theme: 'dark',
                class: 'position-absolute w-100',
              })}
              {panel.content({
                theme: 'light',
                style:
                  'clip-path: polygon(-1px -1px, -1px 101%, 25% 101%, 75% -1px)',
              })}
              {panel.text(Theme.System.title, isSelected ?? false)}
            </div>,
          ],
        },
        {
          value: Theme.Light._value,
          comp: panel.toComp(Theme.Light.title, { theme: 'light' }),
        },
        {
          value: Theme.Dark._value,
          comp: panel.toComp(Theme.Dark.title, { theme: 'dark' }),
        },
      ]}
    />
  );
});
const RolePanel = defineComponent(() => {
  const theme = useTheme();
  return () =>
    udata.value?.auth.recruiter ? (
      <ItemGroup
        v-model={setting.display.role}
        class="d-grid ga-4"
        style="grid-template-columns: repeat(auto-fill, minmax(250px,1fr))"
        mandatory
        items={[
          {
            value: Role.Participant._value,
            comp: panel.toComp(Role.Participant.title, {
              theme: toAppTheme(Role.Participant._value, theme.actual),
              style: {
                '--v-theme-on-surface': 'var(--v-theme-primary)',
                '--v-border-opacity': 0.12,
              },
            }),
          },
          {
            value: Role.Recruiter._value,
            comp: panel.toComp(Role.Recruiter.title, {
              theme: toAppTheme(Role.Recruiter._value, theme.actual),
              style: {
                '--v-theme-on-surface': 'var(--v-theme-primary)',
                '--v-border-opacity': 0.12,
              },
            }),
          },
        ]}
      />
    ) : (
      <VBtn text="成为招募者" onClick={() => {}} />
    );
});

export const route: SupplyRoute = {
  meta: {
    nav: {
      tip: '外观',
      icon: mdiPaletteOutline,
      order: 1,
      groupOrder: 1,
    },
  },
};
export default defineComponent(
  () => {
    const sections = computed(() => {
      return [
        {
          title: '自定义外观',
          items: [
            { title: '角色', comp: RolePanel },
            { title: '主题', comp: ThemePanel },
          ],
        },
      ];
    });
    return () => <SectionGroup {...{ sections: sections.value }} />;
  },
  { name: import.meta.url.match(/\/(\w+)\/index.ts/)?.[1] ?? '无法获取 name' },
);
