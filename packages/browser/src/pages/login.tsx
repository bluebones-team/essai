import { mdiEyeOffOutline, mdiEyeOutline } from '@mdi/js';
import { date_ts, Gender, OutputCode } from 'shared/data';
import { apiRecords, progress } from 'shared/router';
import { defineComponent, reactive, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { VBtn } from 'vuetify/components/VBtn';
import { VMain } from 'vuetify/components/VMain';
import { VTab, VTabs } from 'vuetify/components/VTabs';
import { Dialog } from '~/components/dialog';
import { Form } from '~/components/form';
import { OtpInput } from '~/components/otp-input';
import { c } from '~/ts/client';
import { usePopup } from '~/ts/hook';
import { snackbar, storage, udata } from '~/ts/state';

const PwdLogin = defineComponent(() => {
  const loading = ref(false);
  const showPwd = ref(false);
  const data = reactive({ phone: '', pwd: '' });
  return () => (
    <Form
      model={data}
      schema={apiRecords['/login/pwd'].in}
      layout={(comps) => [
        [
          { comp: comps.phone },
          {
            comp: () => (
              <comps.pwd
                onClick:append={() => (showPwd.value = !showPwd.value)}
                {...(showPwd.value
                  ? { type: 'text', appendIcon: mdiEyeOffOutline }
                  : { type: 'password', appendIcon: mdiEyeOutline })}
              />
            ),
            cols: 12,
          },
          {
            comp: () => (
              <VBtn
                text="登录"
                variant="flat"
                block
                loading={loading.value}
                onClick={() => {
                  c['/login/pwd'].with(progress(loading, 'value')).send(data, {
                    0(res) {
                      storage.setToken(res.data);
                      udata.value = res.data;
                      snackbar.show({ text: '登录成功', color: 'success' });
                    },
                  });
                }}
              />
            ),
          },
        ],
      ]}
    />
  );
});
const PhoneLogin = defineComponent(() => {
  const isValid = ref(false);
  const signupData = reactive({
    phone: '',
    code: '',
    gender: Gender.Female.value,
    birthday: date_ts(Date.now()),
  });
  const signup_dialog = usePopup(Dialog, () => ({
    content: () => (
      <Form
        v-model={isValid.value}
        model={signupData}
        schema={apiRecords['/signup'].in}
        layout={(comps) => [
          [{ comp: comps.gender, cols: 12 }, { comp: comps.birthday }],
        ]}
      />
    ),
    btns: [
      {
        text: '注册',
        variant: 'flat' as const,
        blick: true,
        onClick: () => {
          c['/signup'].send(signupData, {
            0(res) {
              snackbar.show({ text: '注册成功', color: 'success' });
              signup_dialog.close();
            },
          });
        },
      },
    ],
  }));
  return () => (
    <div>
      <signup_dialog.Comp />
      <OtpInput
        onPass={(data, state) => {
          c['/login/phone'].with(progress(state, 'loading')).send(data, {
            0(res) {
              snackbar.show({ text: '验证通过', color: 'success' });
              storage.setToken(res.data);
              udata.value = res.data;
            },
            [OutputCode.NoUser.value]() {
              Object.assign(signupData, data);
              signup_dialog.show();
            },
          });
        }}
      />
    </div>
  );
});

const comps = [
  { text: '密码', comp: PwdLogin },
  { text: '短信', comp: PhoneLogin },
];
export const route: LooseRouteRecord = {};
export default defineComponent({
  name: 'Login',
  // beforeRouteEnter(to, from) {
  //   const { redirect } = to.query;
  //   return !udata.value || (typeof redirect === 'string' ? redirect : '/');
  // },
  setup() {
    const router = useRouter();
    watch(udata, (v) => {
      const { redirect } = router.currentRoute.value.query;
      router.push(typeof redirect === 'string' ? redirect : '/');
    });
    const currentIdx = ref(0);
    return () => (
      <VMain>
        <div class="center d-flex flex-column">
          {comps.map((p, i) => (
            <p.comp v-show={currentIdx.value === i} key={p.text} />
          ))}
          <VTabs v-model={currentIdx.value}>
            {comps.map((p, i) => (
              <VTab text={p.text} value={i} />
            ))}
          </VTabs>
        </div>
      </VMain>
    );
  },
});
