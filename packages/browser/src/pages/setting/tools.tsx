import { SectionGroup } from '~/components/section-group';
import { computed, defineComponent } from 'vue';

export const route: LooseRouteRecord = {};
export default defineComponent(
  () => {
    const sections = computed(() => {
      return [{ title: '工具箱', items: [] }];
    });
    return () => <SectionGroup {...{ sections: sections.value }} />;
  },
  { name: import.meta.url.match(/\/(\w+)\/index.ts/)?.[1] ?? '无法获取 name' },
);
