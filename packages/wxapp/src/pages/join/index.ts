import { c } from '~/ts/util';
import { defineComponent, reactive } from '@vue-mini/core';

defineComponent(() => {
  const state = reactive({
    list: [] as Project['public']['Preview'][],
  });
  return {
    state,
    getList() {
      c['proj/public/list'].send({ pn: 1, ps: 20 }).send({
        0(res) {
          state.list = res.data;
        },
      });
    },
  };
});
