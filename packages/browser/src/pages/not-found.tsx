import { defineComponent } from 'vue';
import { useRouter } from 'vue-router';
import { VBtn } from 'vuetify/components/VBtn';
import { VEmptyState } from 'vuetify/components/VEmptyState';
import { VMain } from 'vuetify/components/VMain';

export const route: LooseRouteRecord = {
  path: '/:pathMatch(.*)*',
};
export default defineComponent(
  function () {
    const router = useRouter();
    return () => (
      <VMain class="h-100 overflow-auto">
        <VEmptyState
          headline="Σ(っ °Д °;)っ, 404"
          title="假装这是一个页面"
          v-slots={{
            actions: () => [
              <VBtn
                text="回到主页"
                variant="flat"
                onClick={() => router.push('/')}
              />,
              <VBtn
                text="返回上页"
                variant="outlined"
                onClick={() => router.back()}
              />,
            ],
          }}
        />
      </VMain>
    );
  },
  { name: 'NotFound' },
);
