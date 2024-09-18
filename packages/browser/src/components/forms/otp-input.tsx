import { account } from 'shared/router';
import { once, progress, type Input } from 'shared/router';
import { useValidator } from 'shared';
import { defineComponent, reactive, ref } from 'vue';
import { VBtn } from 'vuetify/components/VBtn';
import { VTextField } from 'vuetify/components/VTextField';
import { Container, type ContainerDisplay } from '~/components/container';
import { Form } from '~/components/form';
import { client } from '~/ts/client';
import { snackbar, storage } from '~/ts/state';

const data = reactive({ phone: '', code: '' }) satisfies Input['login/otp'];
const timer = {
  time: ref(0),
  countdowm(time: number) {
    this.time.value = time;
    sendState.disabled = true;
    const n = window.setInterval(() => {
      if (--this.time.value === 0) {
        clearInterval(n);
        sendState.disabled = false;
      }
    }, 1e3);
  },
};
const sendState = reactive({ loading: false, disabled: false });
const submitState = reactive({ loading: false, disabled: false });
const onceDecorator = once();

/**检查是否发送验证码 */
function checkSend() {
  return data.phone || snackbar.show({ text: '请输入手机号', color: 'error' });
}
/**行为验证 */
function checkHuman() {
  console.warn('行为验证未实现');
  return true;
}
/**发送验证码 */
function send() {
  if (!(checkSend() && checkHuman())) return;
  new client('phone/code', data.phone)
    .use(progress(sendState, 'loading'))
    .use(onceDecorator)
    .send({
      0() {
        timer.countdowm(60);
      },
    });
}
/**提交验证码 */
function submit(callback: (d: typeof data) => void) {
  new client('login/otp', data)
    .use(progress(submitState, 'loading'))
    .use(onceDecorator)
    .send({
      0(res) {
        snackbar.show({ text: '验证通过', color: 'success' });
        storage.setToken(res.data);
        callback(data);
      },
    });
}
const validator = useValidator(account['login/otp'].req);
const display: ContainerDisplay = [
  [
    {
      cols: 12,
      comp: () => (
        <VTextField
          label="手机号"
          v-model={data.phone}
          rules={validator.phone}
          type="number"
        />
      ),
    },
    {
      comp: () => (
        <VTextField
          label="验证码"
          v-model={data.code}
          rules={validator.code}
          type="number"
          v-slots={{
            'append-inner': () => (
              <VBtn
                class="px-0"
                variant="text"
                density="compact"
                ripple={false}
                text={
                  timer.time.value
                    ? `${timer.time.value}s 后重新发送`
                    : '发送验证码'
                }
                onClick={send}
                {...sendState}
              />
            ),
          }}
        />
      ),
    },
  ],
];
export const OtpInput = defineComponent(function (props: {
  'onPass:code': Parameters<typeof submit>[0];
}) {
  return () => (
    <Form
      size="small"
      actions={[
        {
          text: '验证',
          type: 'submit',
          variant: 'flat',
          block: true,
          ...submitState,
        },
      ]}
      onPass={() => submit(props['onPass:code'])}
    >
      <Container display={display} />
    </Form>
  );
});
