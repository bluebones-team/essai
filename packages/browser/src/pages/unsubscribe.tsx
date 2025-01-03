import { defineComponent, ref } from 'vue';
import { VEmptyState } from 'vuetify/components/VEmptyState';
import { VMain } from 'vuetify/components/VMain';
import { c } from '~/ts//client';

const text = ref('确定退订邮件通知吗？');
function unsubscribe() {
  c['/usr/email/unsubscribe'].send(void 0, {
    0() {
      text.value = '退订成功';
    },
  });
}
export const route: LooseRouteRecord = {};
export default defineComponent(
  () => () => (
    <VMain>
      <VEmptyState
        headline={text.value}
        text="您可以通过设置更改邮件订阅"
        onClick:action={unsubscribe}
      />
    </VMain>
  ),
  { name: 'Unsubscribe' },
);
