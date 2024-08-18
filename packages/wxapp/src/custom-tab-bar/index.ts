import { PanelType } from '~/ts/enum';
import { curTabbar, setting } from '~/ts/state';
import { computed, defineComponent } from '@vue-mini/core';

defineComponent(() => {
  const list = computed(() => PanelType[setting.panelType].tabBars);
  return {
    list,
    curTabbar,
    onChange(e: WechatMiniprogram.CustomEvent) {
      curTabbar.value = e.detail.value;
    },
  };
});
