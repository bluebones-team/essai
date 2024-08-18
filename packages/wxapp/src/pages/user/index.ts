import { defineComponent } from '@vue-mini/core';

defineComponent(() => {
  return {
    year: new Date().getFullYear(),
    links: [
      {
        name: '底部链接',
        url: '/pages/index',
        openType: 'navigate',
      },
    ],
  };
});
