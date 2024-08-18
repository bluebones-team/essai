import { CardType } from 'shared/enum';
import { defineComponent, reactive, ref } from 'vue';
import { VMain } from 'vuetify/components/VMain';
import { VTab, VTabs } from 'vuetify/components/VTabs';
import { DialogForm } from '~/components/dialog-form';
import { OtpInput } from '~/components/forms/otp-input';
import { PasswordInput } from '~/components/forms/pwd-input';
import { RealnameInput } from '~/components/forms/realname-input';
import { usePopup } from '~/ts/hook';
import { udata } from '~/ts/state';

const tab = ref(0);
const data = reactive(
  import.meta.env.DEV
    ? {
        name: '你的名字',
        type: CardType.IDCard,
        num: '389427872894728',
      }
    : { name: '', type: CardType.IDCard, num: '' },
);
const realname_dialog = usePopup(DialogForm, () => ({
  card: { title: '实名认证', subtitle: '本站全面后台实名' },
  content: () => <RealnameInput v-model={data} />,
  onPass: () => console.error('提交实名认证'),
}));
function showRealnameInput() {
  realname_dialog.show();
}

export default defineComponent({
  name: 'Login',
  //@ts-ignore
  beforeRouteEnter(to, from) {
    return !udata.value || to.query.redirect || '/';
  },
  setup() {
    return () => (
      <VMain>
        <div class="center d-flex flex-column">
          {
            [
              <PasswordInput />,
              <OtpInput onPass:code={(data) => showRealnameInput()} />,
            ][tab.value]
          }{' '}
          <VTabs v-model={tab.value}>
            {[
              { text: '密码', value: 0 },
              { text: '短信', value: 1 },
            ].map((p) => (
              <VTab {...p} />
            ))}
          </VTabs>
        </div>
      </VMain>
    );
  },
});
