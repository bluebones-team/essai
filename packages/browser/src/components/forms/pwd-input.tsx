import { mdiEyeOffOutline, mdiEyeOutline } from '@mdi/js';
import { progress } from 'shared/client';
import { r } from 'shared/valid';
import { defineComponent, reactive, ref } from 'vue';
import { VTextField } from 'vuetify/components/VTextField';
import { Container } from '~/components/container';
import { Form } from '~/components/form';
import { client } from '~/ts/client';
import { snackbar, storage, udata } from '~/ts/state';
import { maxNumberLength } from '~/ts/util';

const data = reactive(
  import.meta.env.DEV
    ? { phone: 13975698953, pwd: 'Az123456' }
    : { phone: NaN, pwd: '' },
);
const showPwd = ref(false);
const loading = ref(false);
function login() {
  new client('login', { data }).use(progress(loading, 'value')).send({
    0(res) {
      storage.setToken(res.data);
      udata.value = res.data;
      snackbar.show({ text: '登录成功', color: 'success' });
    },
  });
}
const display = [
  [
    {
      cols: 12,
      comp: () => (
        <VTextField
          label="手机号"
          rules={r.num().phone().c}
          {...maxNumberLength(data, 'phone', 11)}
        />
      ),
    },
    {
      comp: () => (
        <VTextField
          v-model={data.pwd}
          label="密码"
          rules={r.str().min(8).pwd().c}
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
];
export const PasswordInput = defineComponent(function () {
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
      onPass={login}
    >
      <Container display={display} />
    </Form>
  );
});
