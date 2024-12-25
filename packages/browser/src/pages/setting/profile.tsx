import {
  mdiAccountOutline,
  mdiDeleteOutline,
  mdiLogout,
  mdiSquareEditOutline,
} from '@mdi/js';
import { pick, toFieldRules } from 'shared';
import { Gender } from 'shared/data';
import { apiRecords, progress, type In } from 'shared/router';
import {
  computed,
  defineAsyncComponent,
  defineComponent,
  reactive,
  ref,
} from 'vue';
import { useDisplay } from 'vuetify';
import { VBtn } from 'vuetify/components/VBtn';
import { VTextField } from 'vuetify/components/VTextField';
import { Container, type ContainerDisplay } from '~/components/container';
import { DialogForm } from '~/components/dialog-form';
import { Pic } from '~/components/pic';
import { SectionGroup } from '~/components/section-group';
import { c } from '~/ts/client';
import { dateFormat } from '~/ts/date';
import { usePopup } from '~/ts/hook';
import { storage, udata } from '~/ts/state';
import { error } from '~/ts/util';

const rules = toFieldRules(apiRecords['/usr/edit'].in);
/**编辑框 */
function editInput(data: In['/usr/edit']) {
  const { promise, resolve } = Promise.withResolvers<string[]>();
  // c['/usr/face/list'].send(void 0,{
  //   0: (res) => resolve(res.data),
  // });
  const display: ContainerDisplay = [
    [
      {
        comp: () =>
          udata.value ? (
            <VTextField v-model={data.name} label="昵称" rules={rules.name} />
          ) : null,
      },
      {
        cols: 12,
        comp: defineAsyncComponent(async () => {
          const links = await promise;
          return () => (
            <div class="d-grid grid-cols-3 ga-4">
              {links.map((e) => (
                <Pic src={e} />
              ))}
            </div>
          );
        }),
      },
    ],
  ];
  return () => <Container display={display} />;
}
/**编辑用户信息 */
function editBtn() {
  if (!udata.value) return error('用户未登录');
  const loading = ref(false);
  const data = reactive(pick(udata.value, ['name', 'face']));
  const edit_dialog = usePopup(DialogForm, () => ({
    form: { size: 'small' as const },
    content: editInput(data),
    submitText: '更新',
    onPass() {
      c['/usr/edit'].with(progress(loading, 'value')).send(data);
    },
  }));
  return () => (
    <VBtn
      {...{
        variant: 'text',
        icon: mdiSquareEditOutline,
        loading: loading.value,
        onClick() {
          edit_dialog.show();
        },
      }}
    />
  );
}
/**注销 */
function deleteUserBtn() {
  const loading = ref(false);
  return () => (
    <VBtn
      {...{
        variant: 'text',
        icon: mdiDeleteOutline,
        color: 'error',
        loading: loading.value,
        onClick() {
          c['/signoff'].with(progress(loading, 'value')).send(void 0, {
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
}
/**退出登录 */
function logoutBtn() {
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
}

export const route: LooseRouteRecord = {
  meta: {
    nav: {
      tip: '个人资料',
      icon: mdiAccountOutline,
      order: 1,
      groupOrder: 2,
    },
    need: { login: true },
  },
};
export default defineComponent(
  () => {
    const { mobile } = useDisplay();
    const sections = computed(() => {
      if (!udata.value) return [];
      return [
        {
          title: '基本信息',
          subtitle: `ID: ${udata.value.uid}`,
          items: [
            {
              title: udata.value.name,
              subtitle: `${dateFormat(udata.value.birthday)} ${Gender[udata.value.gender].title}`,
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
                  {editBtn()()}
                  {deleteUserBtn()()}
                  {logoutBtn()()}
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
      ];
    });
    return () => <SectionGroup {...{ sections: sections.value }} />;
  },
  { name: import.meta.url.match(/\/(\w+)\/index.ts/)?.[1] ?? '无法获取 name' },
);
