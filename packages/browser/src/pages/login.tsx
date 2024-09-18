import { mdiEyeOffOutline, mdiEyeOutline } from '@mdi/js';
import { account } from 'shared/router';
import { progress, type Input } from 'shared/router';
import { CardType } from 'shared/data';
import { useValidator } from 'shared';
import { user } from 'shared/data';
import { defineComponent, reactive, ref, shallowRef } from 'vue';
import { VMain } from 'vuetify/components/VMain';
import { VSelect } from 'vuetify/components/VSelect';
import { VTab, VTabs } from 'vuetify/components/VTabs';
import { VTextField } from 'vuetify/components/VTextField';
import { Container } from '~/components/container';
import { DialogForm } from '~/components/dialog-form';
import { Form } from '~/components/form';
import { OtpInput } from '~/components/forms/otp-input';
import { client } from '~/ts/client';
import { usePopup } from '~/ts/hook';
import { snackbar, storage, udata } from '~/ts/state';
import { error } from '~/ts/util';

const PwdInput = defineComponent(() => {
  const loading = ref(false);
  const showPwd = ref(false);
  const pwd_data = reactive<Input['login']>({ phone: '', pwd: '' });
  const pwd_validator = useValidator(account.login.req);
  return () => (
    <Form
      size="small"
      actions={[
        {
          text: '登录',
          type: 'submit',
          variant: 'flat',
          loading: loading.value,
          block: true,
        },
      ]}
      onPass={() => {
        new client('login', pwd_data).use(progress(loading, 'value')).send({
          0(res) {
            storage.setToken(res.data);
            udata.value = res.data;
            snackbar.show({ text: '登录成功', color: 'success' });
          },
        });
      }}
    >
      <Container
        display={[
          [
            {
              cols: 12,
              comp: () => (
                <VTextField
                  label="手机号"
                  v-model={pwd_data.phone}
                  rules={pwd_validator.phone}
                  type="number"
                />
              ),
            },
            {
              comp: () => (
                <VTextField
                  v-model={pwd_data.pwd}
                  label="密码"
                  rules={pwd_validator.pwd}
                  onClick:appendInner={() => {
                    showPwd.value = !showPwd.value;
                  }}
                  {...(showPwd.value
                    ? {
                        type: 'text',
                        appendInnerIcon: mdiEyeOffOutline,
                      }
                    : {
                        type: 'password',
                        appendInnerIcon: mdiEyeOutline,
                      })}
                />
              ),
            },
          ],
        ]}
      />
    </Form>
  );
});
const _OtpInput = () => <OtpInput onPass:code={() => realname_dialog.show()} />;
const RealnameInput = defineComponent(() => {
  const realname_data = reactive<User.Auth>({
    type: CardType.IDCard._value,
    name: '',
    num: '',
  });
  const realname_validator = useValidator(user.auth);
  return () => (
    <Container
      display={[
        [
          {
            comp: () => (
              <VTextField
                v-model={realname_data.name}
                label="真实姓名"
                rules={realname_validator.name}
              />
            ),
          },
          {
            cols: 12,
            comp: () => (
              <VSelect
                v-model={realname_data.type}
                label="证件类型"
                rules={realname_validator.type}
                items={CardType._items}
              />
            ),
          },
          {
            comp: () => (
              <VTextField
                v-model={realname_data.num}
                label="证件号"
                rules={realname_validator.num}
              />
            ),
          },
        ],
      ]}
    />
  );
});

const realname_dialog = usePopup(DialogForm, () => ({
  card: { title: '实名认证', subtitle: '本站实施全面后台实名' },
  content: RealnameInput,
  onPass: () => error('提交实名认证'),
}));

export const route: SupplyRoute = {};
export default defineComponent({
  name: 'Login',
  //@ts-ignore
  beforeRouteEnter(to, from) {
    return !udata.value || to.query.redirect || '/';
  },
  setup() {
    const comp = shallowRef(PwdInput);
    return () => (
      <VMain>
        <div class="center d-flex flex-column">
          <comp.value />
          <VTabs v-model={comp.value}>
            {[
              { text: '密码', value: PwdInput },
              { text: '短信', value: _OtpInput },
            ].map((p) => (
              <VTab {...p} />
            ))}
          </VTabs>
        </div>
      </VMain>
    );
  },
});
