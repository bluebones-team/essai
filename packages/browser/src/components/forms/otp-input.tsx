import { toFieldRules } from 'shared';
import { apiRecords, progress, type In } from 'shared/router';
import { defineComponent, reactive, ref } from 'vue';
import { VBtn } from 'vuetify/components/VBtn';
import { VTextField } from 'vuetify/components/VTextField';
import { Container, type ContainerDisplay } from '~/components/container';
import { Form } from '~/components/form';
import { c } from '~/ts/client';
import { snackbar } from '~/ts/state';

const data = reactive({ phone: '', code: '' }) satisfies In['/login/phone'];
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

function send() {
  if (!data.phone)
    return snackbar.show({ text: '请输入手机号', color: 'error' });
  console.warn('行为验证未实现');
  c['/otp/phone'].with(progress(sendState, 'loading')).send(data.phone, {
    0() {
      timer.countdowm(60);
    },
  });
}

const rules = toFieldRules(apiRecords['/login/phone'].in);
const display: ContainerDisplay = [
  [
    {
      cols: 12,
      comp: () => (
        <VTextField
          label="手机号"
          v-model={data.phone}
          rules={rules.phone}
          type="number"
        />
      ),
    },
    {
      comp: () => (
        <VTextField
          label="验证码"
          v-model={data.code}
          rules={rules.code}
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
  onPass(_data: typeof data, state: typeof submitState): void;
}) {
  return () => (
    <Form
      actions={[
        {
          text: '验证',
          type: 'submit',
          variant: 'flat',
          block: true,
          ...submitState,
        },
      ]}
      onPass={() => props['onPass'](data, submitState)}
    >
      <Container display={display} />
    </Form>
  );
});
