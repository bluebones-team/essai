import { defineComponent, reactive } from 'vue';
import { VMain } from 'vuetify/components/VMain';
import { ProjectInfo } from '~/components/proj-info';
import { client } from '~/ts/client';

const state = reactive({
  data: null as Project['Data'] | null,
});
export default defineComponent({
  name: 'Proj',
  beforeRouteEnter(to, from, next) {
    const { dtype, pid } = to.query;
    if (typeof dtype !== 'string' || typeof pid !== 'string')
      return next('/404?msg=params name error');
    if (/^(public|joined|own)$/.test(dtype) && /^\d+$/.test(pid)) {
      new client(`proj/${dtype as 'public' | 'joined' | 'own'}`, {
        pid: +pid,
      }).send({
        0(res) {
          state.data = res.data;
          next();
        },
      });
    }
    next('/404?msg=params value error');
  },
  setup() {
    return (
      <VMain>
        <ProjectInfo v-model={state.data}></ProjectInfo>
      </VMain>
    );
  },
});
