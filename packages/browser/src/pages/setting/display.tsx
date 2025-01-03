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
          value: Theme.System.value,
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
              {panel.text(Theme.System.text, isSelected ?? false)}
            </div>,
          ],
        },
        {
          value: Theme.Light.value,
          comp: panel.toComp(Theme.Light.text, { theme: 'light' }),
        },
        {
          value: Theme.Dark.value,
          comp: panel.toComp(Theme.Dark.text, { theme: 'dark' }),
        },
      ]}
    />
  );
});
const RolePanel = defineComponent(() => {
  const theme = useTheme();
  return () =>
    udata.value?.recruiter ? (
      <ItemGroup
        v-model={setting.display.role}
        class="d-grid ga-4"
        style="grid-template-columns: repeat(auto-fill, minmax(250px,1fr))"
        mandatory
        items={[
          {
            value: Role.Participant.value,
            comp: panel.toComp(Role.Participant.text, {
              theme: toAppTheme(Role.Participant.value, theme.actual),
              style: {
                '--v-theme-on-surface': 'var(--v-theme-primary)',
                '--v-border-opacity': 0.12,
              },
            }),
          },
          {
            value: Role.Recruiter.value,
            comp: panel.toComp(Role.Recruiter.text, {
              theme: toAppTheme(Role.Recruiter.value, theme.actual),
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

export const route: LooseRouteRecord = {
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
          title: ' ',
          items: [
            { title: '主题', comp: ThemePanel },
            { title: '角色', comp: RolePanel },
          ],
        },
      ];
    });
    return () => <SectionGroup {...{ sections: sections.value }} />;
  },
  { name: import.meta.url.match(/\/(\w+)\/index.ts/)?.[1] ?? '无法获取 name' },
);
