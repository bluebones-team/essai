import { once, progress } from 'shared/client';
import { r } from 'shared/valid';
import { defineComponent, reactive, ref } from 'vue';
import { VBtn } from 'vuetify/components/VBtn';
import { VTextField } from 'vuetify/components/VTextField';
import { Container, type ContainerDisplay } from '~/components/container';
import { Form } from '~/components/form';
import { client } from '~/ts/client';
import { snackbar, storage } from '~/ts/state';
import { maxNumberLength } from '~/ts/util';

const data = reactive({ phone: NaN, code: NaN });
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
  if (data.phone) {
    return true;
  } else {
    snackbar.show({ text: '请输入手机号', color: 'error' });
    return false;
  }
}
/**行为验证 */
function checkHuman() {
  console.warn('还没写行为验证');
  return true;
}
/**发送验证码 */
function send() {
  if (!(checkSend() && checkHuman())) return;
  new client('phone/code', { params: { phone: data.phone } })
    .use(progress(sendState, 'loading'))
    .use(onceDecorator)
    .send({
      0() {
        timer.countdowm(60);
      },
    });
}
/**提交验证码 */
function submit(callback: (data: { phone: number; code: number }) => void) {
  new client('login/otp', { params: data })
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

const display: ContainerDisplay = [
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
        <VTextField label="验证码" {...maxNumberLength(data, 'code', 6)}>
          {{
            'append-inner': () => (
              <VBtn
                {...{
                  ...sendState,
                  ripple: false,
                  class: 'px-0',
                  variant: 'text',
                  density: 'compact',
                  text: timer.time.value
                    ? `重新发送(${timer.time.value})`
                    : '发送验证码',
                  onClick: send,
                }}
              />
            ),
          }}
        </VTextField>
      ),
    },
  ],
];
export const OtpInput = defineComponent(function (props: {
  'onPass:code': (data: { phone: number; code: number }) => void;
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
