import { apiRecords, progress, type In } from 'shared/router';
import { defineComponent, reactive, ref } from 'vue';
import { VBtn } from 'vuetify/components/VBtn';
import { c } from '~/ts/client';
import { useTimer } from '~/ts/hook';
import { snackbar } from '~/ts/state';
import { Form } from './form';

const submitState = reactive({ loading: false, disabled: false });
export const OtpInput = defineComponent(function (props: {
  onPass(data: In['/login/phone'], state: typeof submitState): void;
}) {
  const SendBtn = defineComponent(() => {
    const { time, countdown } = useTimer();
    const loading = ref(false);
    return () => (
      <VBtn
        class="px-0"
        variant="text"
        density="compact"
        ripple={false}
        text={time.value ? `重新发送（${time.value}）` : '发送验证码'}
        onClick={function () {
          if (!data.phone)
            return snackbar.show({ text: '请输入手机号', color: 'error' });
          console.warn('行为验证未实现');
          c['/otp/phone'].with(progress(loading, 'value')).send(data.phone, {
            0() {
              countdown(60);
            },
          });
        }}
        loading={loading.value}
        disabled={!!time.value}
      />
    );
  });
  const isValid = ref(false);
  const data = reactive({ phone: '', code: '' });
  return () => (
    <Form
      v-model={isValid.value}
      model={data}
      schema={apiRecords['/login/phone'].in}
      layout={(comps) => [
        [
          { cols: 12, comp: comps.phone },
          {
            comp: () => <comps.code slots={{ append: () => <SendBtn /> }} />,
          },
        ],
        [
          {
            comp: () => (
              <VBtn
                text="验证"
                variant="flat"
                block
                {...submitState}
                onClick={() =>
                  isValid.value && props['onPass'](data, submitState)
                }
              />
            ),
          },
        ],
      ]}
    />
  );
});
