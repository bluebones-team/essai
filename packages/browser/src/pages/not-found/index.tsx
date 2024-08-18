import { defineComponent } from 'vue';
import { useRouter } from 'vue-router';
import { VBtn } from 'vuetify/components/VBtn';
import { VEmptyState } from 'vuetify/components/VEmptyState';
import { VMain } from 'vuetify/components/VMain';

export default defineComponent(
  function () {
    const router = useRouter();
    return () => (
      <VMain class="h-100 overflow-auto">
        <VEmptyState headline="Σ(っ °Д °;)っ, 404" title="你来到了未知的页面">
          {{
            actions: () => [
              <VBtn
                color="white"
                text="回到主页"
                onClick={() => router.push('/')}
              />,
              <VBtn text="返回上页" onClick={() => router.back()} />,
            ],
          }}
        </VEmptyState>
      </VMain>
    );
  },
  { name: 'NotFound' }
);
