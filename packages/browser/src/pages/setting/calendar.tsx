import { computed, defineComponent } from 'vue';
import { VRangeSlider } from 'vuetify/components/VRangeSlider';
import { SectionGroup } from '~/components/section-group';
import { setting } from '~/ts/state';

export const route: SupplyRoute = {};
export default defineComponent(
  () => {
    const sections = computed(() => {
      return [
        {
          title: '日程表外观',
          items: [
            {
              title: '时间轴范围',
              subtitle: '表示每天的工作时间范围，如：8 时~22 时',
              comp: () => (
                <VRangeSlider
                  v-model={setting.calendar.timeline}
                  {...{
                    hint: '单位: 小时',
                    min: 0,
                    max: 24,
                    step: 1,
                    thumbLabel: true,
                    showTicks: true,
                    persistentHint: true,
                    onContextmenu: (e: MouseEvent) => {
                      console.log(setting.calendar);
                    },
                  }}
                />
              ),
            },
          ],
        },
      ];
    });
    return () => <SectionGroup {...{ sections: sections.value }} />;
  },
  {
    name: import.meta.url.match(/\/(\w+)\/index.ts/)?.[1] ?? '无法获取 name',
  },
);
