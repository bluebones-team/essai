import { reactive, ref, watchEffect } from '@vue-mini/core';
import { PanelType, Tabbar } from './enum';

export const setting = reactive({
  panelType: PanelType.participate.value as PanelType,
});
export const curTabbar = ref<Tabbar>(Tabbar.user.value);
watchEffect(() => {
  console.log(curTabbar.value);
  wx.switchTab({ url: `/pages/${Tabbar[curTabbar.value].name}/index` });
});
