import { c } from '~/ts/client';
import { defineComponent, reactive } from '@vue-mini/core';

defineComponent(() => {
  const state = reactive({
    list: [] as FTables['experiment']['public']['preview'][],
  });
  return {
    state,
    getList() {
      c['/exp/public/list'].send(
        { pn: 1, ps: 20 },
        {
          0(res) {
            state.list = res.data;
          },
        },
      );
    },
  };
});
