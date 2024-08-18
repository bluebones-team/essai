import { mdiDeleteOutline, mdiLogout, mdiSquareEditOutline } from '@mdi/js';
import { pick } from 'lodash-es';
import { progress } from 'shared/client';
import { Gender } from 'shared/enum';
import { r } from 'shared/valid';
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
import { client } from '~/ts/client';
import { dateFormat } from '~/ts/date';
import { usePopup } from '~/ts/hook';
import { storage, udata } from '~/ts/state';
import { catcher } from '~/ts/util';
import { comp } from '../components/util';

/**编辑框 */
function editInput(data: { name: string; face: string }) {
  const { promise, resolve } = Promise.withResolvers<string[]>();
  new client('usr/face/list', null).send({
    0: (res) => resolve(res.data),
  });
  const display: ContainerDisplay = [
    [
      {
        comp: () =>
          udata.value ? (
            <VTextField
              v-model={data.name}
              label="昵称"
              rules={r.str().name().c}
            />
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
  if (!udata.value) {
    return catcher('用户未登录', { throw: true });
  }
  const loading = ref(false);
  const data = reactive(pick(udata.value, ['name', 'face']));
  const edit_dialog = usePopup(DialogForm, () => ({
    form: { size: 'small' as const },
    content: editInput(data),
    submitText: '更新',
    onPass() {
      new client('usr/edit', data).use(progress(loading, 'value')).send();
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
          new client('usr/del', null).use(progress(loading, 'value')).send({
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
          new client('logout', null).use(progress(loading, 'value')).send({
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
            comp.text(udata.value.auth.realname ?? '未实名', '实名认证'),
            comp.text(udata.value.emails[0], '招募者认证'),
          ],
        },
      ];
    });
    return () => <SectionGroup {...{ sections: sections.value }} />;
  },
  { name: import.meta.url.match(/\/(\w+)\/index.ts/)?.[1] ?? '无法获取 name' },
);
