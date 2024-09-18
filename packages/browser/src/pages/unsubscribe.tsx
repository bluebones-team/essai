import { ref } from 'vue';
import { VEmptyState } from 'vuetify/components/VEmptyState';
import { VMain } from 'vuetify/components/VMain';
import { client } from '~/ts//client';
import { defineComponent } from 'vue';

const text = ref('确定退订邮件通知吗？');
function unsubscribe() {
  new client('usr/email/unsubscribe', null).send({
    0() {
      text.value = '退订成功';
    },
  });
}
export const route: SupplyRoute = {};
export default defineComponent(
  () => () => (
    <VMain>
      <VEmptyState
        headline={text.value}
        text="您可以通过设置更改邮件订阅"
        onClick:action={unsubscribe}
      ></VEmptyState>
    </VMain>
  ),
  { name: 'Unsubscribe' },
);
