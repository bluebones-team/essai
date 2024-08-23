import { computed, defineComponent } from 'vue';
import { SectionGroup } from '~/components/section-group';
import { setting, udata } from '~/ts/state';
import { comp } from '../components/util';

export default defineComponent(
  () => {
    const sections = computed(() => {
      if (!udata.value) return [];
      return [
        {
          title: '隐私相关',
          items: [
            comp.switch(
              [setting.privacy, 'allowAddToLib'],
              '允许被收集',
              '启用后，招募者可以将您收集到其参与者库中，以便后续向您推送项目',
            ),
          ],
        },
        {
          title: '应用权限',
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
  },
  { name: import.meta.url.match(/\/(\w+)\/index.ts/)?.[1] ?? '无法获取 name' },
);
