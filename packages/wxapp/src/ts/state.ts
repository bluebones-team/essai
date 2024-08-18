import { reactive, ref, watchEffect } from '@vue-mini/core';
import { PanelType, Tabbar } from './enum';

export const setting = reactive({
  panelType: PanelType.participate._value as PanelType,
});
export const curTabbar = ref<Tabbar>(Tabbar.user._value);
watchEffect(() => {
  console.log(curTabbar.value);
  wx.switchTab({ url: `/pages/${Tabbar[curTabbar.value]._name}/index` });
});
