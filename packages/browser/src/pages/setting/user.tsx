import {
  mdiAccountOutline,
  mdiDeleteOutline,
  mdiLogout,
  mdiSquareEditOutline,
} from '@mdi/js';
import { Gender } from 'shared/data';
import { apiRecords, progress } from 'shared/router';
import { computed, defineComponent, reactive, ref } from 'vue';
import { useDisplay } from 'vuetify';
import { VBtn } from 'vuetify/components/VBtn';
import { VTextField } from 'vuetify/components/VTextField';
import { Dialog } from '~/components/dialog';
import { Form } from '~/components/form';
import { OtpInput } from '~/components/otp-input';
import { Pic } from '~/components/pic';
import { SectionGroup } from '~/components/section-group';
import { c } from '~/ts/client';
import { dateFormat } from '~/ts/date';
import { usePopup } from '~/ts/hook';
import { storage, udata } from '~/ts/state';
import { definePageComponent, error } from '~/ts/util';

/**编辑用户信息 */
const EditBtn = defineComponent(function () {
  if (!udata.value) return error('用户未登录');
  const loading = ref(false);
  const data = reactive({});
  const isValid = ref(false);
  const dialog = usePopup(Dialog, () => ({
    content: () => (
      <Form
        v-model={isValid.value}
        model={data}
        schema={apiRecords['/usr/u'].in}
        layout={(comps) => [
          [
            { comp: udata.value ? comps.name : () => null },
            {
              cols: 12,
              comp: () => (
                <div class="d-grid grid-cols-3 ga-4">
                  {[].map((e) => (
                    <Pic src={e} />
                  ))}
                </div>
              ),
            },
          ],
        ]}
      />
    ),
    btns: [
      {
        text: '更新',
        onClick: () =>
          isValid.value &&
          c['/usr/u'].with(progress(loading, 'value')).send(data),
      },
    ],
  }));
  return () => (
    <VBtn
      {...{
        variant: 'text',
        icon: mdiSquareEditOutline,
        loading: loading.value,
        onClick() {
          dialog.show();
        },
      }}
    />
  );
});
/**注销 */
const DeleteUserBtn = defineComponent(function () {
  const loading = ref(false);
  return () => (
    <VBtn
      {...{
        variant: 'text',
        icon: mdiDeleteOutline,
        color: 'error',
        loading: loading.value,
        onClick() {
          c['/usr/d'].with(progress(loading, 'value')).send(void 0, {
            0() {
              udata.value = void 0;
              storage.removeToken();
              location.href = '/';
            },
          });
        },
      }}
    />
  );
});
/**退出登录 */
const LogoutBtn = defineComponent(function () {
  const loading = ref(false);
  return () => (
    <VBtn
      {...{
        text: '退出登录',
        prependIcon: mdiLogout,
        color: 'error',
        loading: loading.value,
        onClick() {
          udata.value = void 0;
          storage.removeToken();
          location.href = '/';
        },
      }}
    />
  );
});

/**更改密码 */
function pwdEditInput() {
  const loading = ref(false);
  const data = reactive({ old: '', new: '' });
  const isValid = ref(false);
  return () => (
    <Form
      v-model={isValid.value}
      model={data}
      schema={apiRecords['/usr/pwd/u'].in}
      layout={(comps) => [
        [
          { comp: comps.old },
          { comp: comps.new, cols: 12 },
          {
            comp: () => (
              <VTextField
                label="确认新密码"
                rules={[(value) => value === data.new || '前后密码不一致']}
              />
            ),
          },
        ],
        [
          {
            comp: () => (
              <VBtn
                text="更新密码"
                variant="flat"
                block
                loading={loading.value}
                onCLick={() =>
                  isValid.value &&
                  c['/usr/pwd/u'].with(progress(loading, 'value')).send(data)
                }
              />
            ),
          },
        ],
      ]}
    />
  );
}
/**更改手机号 */
function phoneEditInput() {
  return () => <OtpInput onPass={(data) => {}} />;
}
export const route: LooseRouteRecord = {
  meta: {
    nav: {
      tip: '个人中心',
      icon: mdiAccountOutline,
      order: 1,
    },
    need: { login: true },
  },
};
export default definePageComponent(import.meta.url, () => {
  const { xs, mobile } = useDisplay();
  const state = reactive({ showPwd: false, showOtp: false });
  const sections = computed(() => {
    if (!udata.value) return [];
    return [
      {
        title: '基本信息',
        subtitle: `ID: ${udata.value.uid}`,
        items: [
          {
            title: udata.value.name,
            subtitle: `${dateFormat(udata.value.birthday)} ${Gender[udata.value.gender].text}`,
            horizontal: !mobile.value,
            prepend: () => (
              <Pic
                {...{
                  class: 'ma-6 mr-2',
                  size: 44,
                  src: udata.value?.face ?? '',
                }}
              />
            ),
            comp: () => (
              <div class="d-flex ga-2 align-center">
                <EditBtn />
                <DeleteUserBtn />
                <LogoutBtn />
              </div>
            ),
          },
        ],
      },
      {
        title: '身份认证',
        items: [
          // {
          //   title: '实名认证',
          //   subtitle: udata.value.auth.realname ?? '未实名',
          //   horizontal: true,
          // },
          {
            title: '招募者认证',
            subtitle: udata.value.emails[0],
            horizontal: true,
          },
        ],
      },
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
                    c['/usr/email/d'].send(e);
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
        content={pwdEditInput()}
      />
      <Dialog
        v-model={state.showOtp}
        title="更改手机号"
        content={phoneEditInput()}
      />
    </div>
  );
});
