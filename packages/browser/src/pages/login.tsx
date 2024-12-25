import { mdiEyeOffOutline, mdiEyeOutline } from '@mdi/js';
import { toFieldRules } from 'shared';
import { apiRecords, progress, type In } from 'shared/router';
import { defineComponent, reactive, ref, shallowRef } from 'vue';
import { VMain } from 'vuetify/components/VMain';
import { VTab, VTabs } from 'vuetify/components/VTabs';
import { VTextField } from 'vuetify/components/VTextField';
import { Container } from '~/components/container';
import { Form } from '~/components/form';
import { OtpInput } from '~/components/forms/otp-input';
import { c } from '~/ts/client';
import { snackbar, storage, udata } from '~/ts/state';

const PwdInput = defineComponent(() => {
  const loading = ref(false);
  const showPwd = ref(false);
  const pwd_data = reactive<In['/login/pwd']>({ phone: '', pwd: '' });
  const pwd_validator = toFieldRules(apiRecords['/login/pwd'].in);
  return () => (
    <Form
      actions={[
        {
          text: '登录',
          type: 'submit',
          variant: 'flat',
          block: true,
          loading: loading.value,
        },
      ]}
      onPass={() => {
        c['/login/pwd'].with(progress(loading, 'value')).send(pwd_data, {
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
                    ? { type: 'text', appendInnerIcon: mdiEyeOffOutline }
                    : { type: 'password', appendInnerIcon: mdiEyeOutline })}
                />
              ),
            },
          ],
        ]}
      />
    </Form>
  );
});
const _OtpInput = () => (
  <OtpInput
    onPass={(data, state) => {
      c['/login/phone'].with(progress(state, 'loading')).send(data, {
        0(res) {
          snackbar.show({ text: '验证通过', color: 'success' });
          storage.setToken(res.data);
          udata.value = res.data;
        },
        1(res) {},
      });
    }}
  />
);
// const RealnameInput = defineComponent(() => {
//   const realname_data = reactive<User.Auth>({
//     type: CardType.IDCard.value,
//     name: '',
//     num: '',
//   });
//   const realname_validator = toFieldRules(user.auth);
//   return () => (
//     <Container
//       display={[
//         [
//           {
//             comp: () => (
//               <VTextField
//                 v-model={realname_data.name}
//                 label="真实姓名"
//                 rules={realname_validator.name}
//               />
//             ),
//           },
//           {
//             cols: 12,
//             comp: () => (
//               <VSelect
//                 v-model={realname_data.type}
//                 label="证件类型"
//                 rules={realname_validator.type}
//                 items={CardType.items}
//               />
//             ),
//           },
//           {
//             comp: () => (
//               <VTextField
//                 v-model={realname_data.num}
//                 label="证件号"
//                 rules={realname_validator.num}
//               />
//             ),
//           },
//         ],
//       ]}
//     />
//   );
// });

// const realname_dialog = usePopup(DialogForm, () => ({
//   card: { title: '实名认证', subtitle: '本站实施全面后台实名' },
//   content: RealnameInput,
//   onPass: () => error('提交实名认证'),
// }));
const comps = [
  { text: '密码', comp: PwdInput },
  { text: '短信', comp: _OtpInput },
];

export const route: LooseRouteRecord = {};
export default defineComponent({
  name: 'Login',
  beforeRouteEnter(to, from) {
    const { redirect } = to.query;
    return !udata.value || (typeof redirect === 'string' ? redirect : '/');
  },
  setup() {
    const currentIdx = shallowRef(0);
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
