import { client } from '~/ts/util';
import { defineComponent, reactive } from '@vue-mini/core';

defineComponent(() => {
  const state = reactive({
    list: [] as Project.Public.Preview[],
  });
  return {
    state,
    getList() {
      new client('proj/public/list', { pn: 1, ps: 20 }).send({
        0(res) {
          state.list = res.data;
        },
      });
    },
  };
});
