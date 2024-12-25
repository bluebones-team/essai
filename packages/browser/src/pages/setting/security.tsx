import {
  mdiDeleteOutline,
  mdiShieldCheckOutline,
  mdiSquareEditOutline,
} from '@mdi/js';
import { apiRecords, progress } from 'shared/router';
import { toFieldRules } from 'shared';
import { computed, defineComponent, reactive, ref } from 'vue';
import { useDisplay } from 'vuetify';
import { VBtn } from 'vuetify/components/VBtn';
import { VTextField } from 'vuetify/components/VTextField';
import { Container } from '~/components/container';
import { Dialog } from '~/components/dialog';
import { Form } from '~/components/form';
import { OtpInput } from '~/components/forms/otp-input';
import { SectionGroup } from '~/components/section-group';
import { c } from '~/ts//client';
import { udata } from '~/ts/state';

const rules = toFieldRules(apiRecords['/usr/pwd/edit'].in);
/**更改密码 */
function passwordEditInput() {
  const loading = ref(false);
  const data = reactive({ old: '', new: '' });
  const display = [
    [
      {
        comp: () => (
          <VTextField v-model={data.old} label="旧密码" rules={rules.old} />
        ),
      },
      {
        cols: 12,
        comp: () => (
          <VTextField v-model={data.new} label="新密码" rules={rules.new} />
        ),
      },
      {
        comp: () => (
          <VTextField
            label="确认新密码"
            rules={[(value) => value === data.new || '前后密码不一致']}
          />
        ),
      },
    ],
  ];
  return () => (
    <Form
      size="small"
      actions={[
        {
          text: '更新密码',
          type: 'submit',
          variant: 'flat' as const,
          block: true,
          loading: loading.value,
        },
      ]}
      onPass={() => {
        c['/usr/pwd/edit'].with(progress(loading, 'value')).send(data);
      }}
    >
      <Container display={display} />
    </Form>
  );
}
/**更改手机号 */
function phoneEditInput() {
  return () => <OtpInput onPass={(data) => {}} />;
}

export const route: LooseRouteRecord = {
  meta: {
    nav: {
      tip: '账号安全',
      icon: mdiShieldCheckOutline,
      order: 2,
      groupOrder: 2,
    },
    need: { login: true },
  },
};
export default defineComponent(
  () => {
    const { xs } = useDisplay();
    const state = reactive({ showPwd: false, showOtp: false });
    const sections = computed(() => {
      if (!udata.value) return [];
      return [
        {
          title: '登录相关',
          items: [
            {
              title: '更改密码',
              subtitle: '密码可以让登录更方便',
              horizontal: true,
              comp: () => (
                <VBtn
                  {...{
                    variant: 'text',
                    icon: mdiSquareEditOutline,
                    onClick() {
                      state.showPwd = true;
                    },
                  }}
                />
              ),
            },
            {
              title: '更改手机号',
              subtitle: '手机号是账号身份的主要凭证',
              horizontal: true,
              comp: () => (
                <VBtn
                  {...{
                    variant: 'text',
                    icon: mdiSquareEditOutline,
                    onClick() {
                      state.showOtp = true;
                    },
                  }}
                />
              ),
            },
          ],
        },
        {
          title: '邮箱',
          items: udata.value.emails.map((e, i) => ({
            title: e,
            // subtitle: i ? '该邮箱用于接收消息' : '该邮箱用于密码重置',
            horizontal: !xs.value,
            comp: () => (
              <div class="d-flex">
                <VBtn
                  {...{
                    variant: 'text',
                    color: 'error',
                    icon: mdiDeleteOutline,
                    onClick() {
                      c['/usr/email/remove'].send(e);
                    },
                  }}
                />
                <VBtn
                  {...{
                    variant: 'text',
                    icon: mdiSquareEditOutline,
                    onClick() {},
                  }}
                />
              </div>
            ),
          })),
        },
      ];
    });
    return () => (
      <div>
        <SectionGroup {...{ sections: sections.value }} />
        <Dialog
          v-model={state.showPwd}
          title="更改密码"
          content={passwordEditInput()}
        />
        <Dialog
          v-model={state.showOtp}
          title="更改手机号"
          content={phoneEditInput()}
        />
      </div>
    );
  },
  { name: import.meta.url.match(/\/(\w+)\/index.ts/)?.[1] ?? '无法获取 name' },
);
