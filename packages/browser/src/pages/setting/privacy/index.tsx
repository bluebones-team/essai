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
              '允许被招募者收集到参与者库',
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
