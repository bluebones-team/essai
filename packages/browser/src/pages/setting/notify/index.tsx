import { computed, defineComponent } from 'vue';
import { VSlider } from 'vuetify/components/VSlider';
import { SectionGroup } from '~/components/section-group';
import { setting } from '~/ts/state';

export default defineComponent(
  () => {
    const sections = computed(() => {
      return [
        {
          title: '通知',
          items: [
            {
              title: '消息已读定时',
              subtitle: '如果设为 2s，则消息将在打开 2s 后自动标记为已读',
              comp: () => (
                <VSlider
                  v-model={setting.notify.readDelay}
                  {...{
                    hint: '单位: 秒',
                    min: 0,
                    max: 5,
                    step: 1,
                    thumbLabel: true,
                    showTicks: true,
                    persistentHint: true,
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
  { name: import.meta.url.match(/\/(\w+)\/index.ts/)?.[1] ?? '无法获取 name' },
);
