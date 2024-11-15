import {
  mdiArrowLeft,
  mdiDeleteOutline,
  mdiInformationOutline,
  mdiSendOutline,
} from '@mdi/js';
import {
  Gender,
  ProjectState,
  ProjectType,
  RecruitmentType,
  Role,
} from 'shared/data';
import { defineComponent, watchEffect } from 'vue';
import { useDisplay } from 'vuetify';
import { VAlert } from 'vuetify/components/VAlert';
import { VBtn } from 'vuetify/components/VBtn';
import { VBtnToggle } from 'vuetify/components/VBtnToggle';
import { VChip } from 'vuetify/components/VChip';
import { VFab } from 'vuetify/components/VFab';
import { VMain } from 'vuetify/components/VMain';
import { VToolbar } from 'vuetify/components/VToolbar';
import { Dialog } from '~/components/dialog';
import { Table } from '~/components/table';
import { c } from '~/ts/client';
import { birth_age } from 'shared/data';
import { useLib, usePopup, useProj } from '~/ts/hook';
import { snackbar } from '~/ts/state';

const { state: proj, fetchList: fetchProjList } = useProj('own');
const { state: lib, fetchList: fetchLibList } = useLib();

const _Table = () => (
  <Table
    v-model={proj.preview}
    items={proj.list}
    headers={[
      { title: '名称', key: 'title' },
      {
        title: '类型',
        key: 'type',
        value: (item) => (
          <VChip color={ProjectType[item.type].color}>
            {ProjectType[item.type].name}
          </VChip>
        ),
      },
    ]}
    v-slots={{
      toolbar: () => <VToolbar title="已发布的项目" />,
      noData: () => (
        <VAlert title="当前区域没有项目" icon={mdiInformationOutline} />
      ),
    }}
  />
);
const _LibTable = defineComponent(() => {
  const { mobile } = useDisplay();
  return () => (
    <Table
      v-model={lib.selected}
      items={lib.list}
      multiple
      headers={[
        // {
        //     title: '头像',
        //     key: 'face',
        //     value: (item) => <Image size={32} src={item.face} />,
        // },
        { title: '昵称', key: 'name', minWidth: '6rem' },
        {
          title: '性别',
          key: 'gender',
          value: (item) => Gender[item.gender].title,
        },
        {
          title: '年龄',
          key: 'birthday',
          value: (item) => birth_age(item.birthday),
        },
        {
          title: '操作',
          key: '' as any,
          width: '4rem',
          sortable: false,
          value: (item) => (
            <VBtn
              icon={mdiDeleteOutline}
              color="error"
              variant="text"
              onClick={(e: MouseEvent) => {
                e.stopPropagation();
                c['lib/remove'].send(
                  { rtype: lib.rtype, uid: item.uid },
                  {
                    0(res) {
                      lib.list.splice(lib.list.indexOf(item), 1);
                    },
                  },
                );
              }}
            ></VBtn>
          ),
        },
      ]}
      v-slots={{
        toolbar: () => [
          mobile.value && (
            <VBtn icon={mdiArrowLeft} onClick={lib_dialog.close} />
          ),
          <VBtnToggle
            v-model={lib.rtype}
            onUpdate:modelValue={fetchLibList}
            class="bg-surface mx-auto"
            density="compact"
            variant="outlined"
            divided
            mandatory
          >
            {proj.data?.recruitments.map(({ rtype }) => {
              const e = RecruitmentType[rtype];
              return <VBtn value={e.value}>{e.title}</VBtn>;
            })}
          </VBtnToggle>,
        ],
        noData: () => '暂无可推送的参与者',
      }}
    />
  );
});
const _LibFab = () => (
  <VFab
    class="ms-4"
    icon={mdiSendOutline}
    location="bottom end"
    absolute
    app
    onClick={() => {
      if (!proj.preview) return snackbar.show({ text: '请选择要推送的项目' });
      if (!lib.selected.length)
        return snackbar.show({ text: '请选择要推送的参与者' });
      c['lib/push'].send(
        {
          pid: proj.preview.pid,
          rtype: lib.rtype,
          uids: lib.selected.map((e) => e.uid),
        },
        {
          0(res) {
            snackbar.show({
              text: `${proj.preview?.title} 推送成功`,
              color: 'success',
            });
          },
        },
      );
    }}
  />
);
const _Lib = () => (
  <div class="position-relative h-100">
    <_LibTable />
    <_LibFab />
  </div>
);

const lib_dialog = usePopup(Dialog, () => ({ content: _Lib }));
watchEffect(() => {
  if (proj.data) lib_dialog.show();
});

export const route: LooseRouteRecord = {
  meta: {
    nav: {
      tip: '推送',
      icon: mdiSendOutline,
      order: 5,
    },
    need: {
      login: true,
      role: Role.Recruiter.value,
    },
  },
};
export default defineComponent({
  name: 'Push',
  beforeRouteEnter(to, from, next) {
    Promise.allSettled([
      fetchProjList({ state: ProjectState.Passed.value }),
      fetchLibList(),
    ]).finally(next);
  },
  setup() {
    const { mobile } = useDisplay();
    return () => (
      <VMain class="h-100 d-grid grid-col-auto">
        <_Table />
        {mobile.value ? <lib_dialog.Comp /> : <_Lib />}
      </VMain>
    );
  },
});
