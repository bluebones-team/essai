import { mdiArrowLeft, mdiDeleteOutline, mdiSendOutline } from '@mdi/js';
import {
  birth2age,
  ExperimentState,
  ExperimentType,
  Gender,
  RecruitmentType,
  Role,
} from 'shared/data';
import { defineComponent, watchEffect } from 'vue';
import { useDisplay } from 'vuetify';
import { VBtn } from 'vuetify/components/VBtn';
import { VBtnToggle } from 'vuetify/components/VBtnToggle';
import { VChip } from 'vuetify/components/VChip';
import { VFab } from 'vuetify/components/VFab';
import { VMain } from 'vuetify/components/VMain';
import { VToolbar } from 'vuetify/components/VToolbar';
import { Dialog } from '~/components/dialog';
import { Table } from '~/components/table';
import { c } from '~/ts/client';
import { useExperiment, usePopup, useUserParticipant } from '~/ts/hook';
import { snackbar } from '~/ts/state';
import { definePageComponent } from '~/ts/util';

const { state: exp, fetchList: fetchExpList } = useExperiment('own');
const { state: ptc, fetchList: fetchPtcList } = useUserParticipant();

const _Table = () => (
  <Table
    v-model={exp.selected}
    items={exp.list}
    headers={[
      { title: '名称', key: 'title' },
      {
        title: '类型',
        key: 'type',
        value: (item) => (
          <VChip color={ExperimentType[item.type].color}>
            {ExperimentType[item.type].name}
          </VChip>
        ),
      },
    ]}
    slots={{
      toolbar: () => <VToolbar title="已发布的项目" />,
      noData: () => '当前区域没有项目',
    }}
  />
);
const _LibTable = defineComponent(() => {
  const { mobile } = useDisplay();
  return () => (
    <Table
      v-model={ptc.selected}
      items={ptc.list}
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
          value: (item) => Gender[item.gender].text,
        },
        {
          title: '年龄',
          key: 'birthday',
          value: (item) => birth2age(item.birthday),
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
                c['/usr/ptc/d'].send(
                  { rtype: ptc.rtype, uid: item.uid },
                  {
                    0(res) {
                      ptc.list.splice(ptc.list.indexOf(item), 1);
                    },
                  },
                );
              }}
            ></VBtn>
          ),
        },
      ]}
      slots={{
        toolbar: () => [
          mobile.value && (
            <VBtn icon={mdiArrowLeft} onClick={lib_dialog.close} />
          ),
          <VBtnToggle
            v-model={ptc.rtype}
            onUpdate:modelValue={fetchPtcList}
            class="bg-surface mx-auto"
            density="compact"
            variant="outlined"
            divided
            mandatory
          >
            {RecruitmentType.items.map((e) => (
              <VBtn value={e.value}>{e.text}</VBtn>
            ))}
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
      if (!exp.selected) return snackbar.show({ text: '请选择要推送的项目' });
      if (!ptc.selected.length)
        return snackbar.show({ text: '请选择要推送的参与者' });
      c['/exp/push'].send(
        {
          eid: exp.selected.eid,
          rtype: ptc.rtype,
          uids: ptc.selected.map((e) => e.uid),
        },
        {
          0(res) {
            snackbar.show({
              text: `${exp.selected?.title} 推送成功`,
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
  if (exp.selected) lib_dialog.show();
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
export default definePageComponent(
  import.meta.url,
  () => {
    const { mobile } = useDisplay();
    return () => (
      <VMain class="h-100 d-grid grid-col-auto">
        <_Table />
        {mobile.value ? <lib_dialog.Comp /> : <_Lib />}
      </VMain>
    );
  },
  {
    beforeRouteEnter(to, from, next) {
      Promise.allSettled([
        fetchExpList({
          state: ExperimentState.Passed.value,
          rtype: RecruitmentType.Subject.value,
        }),
        fetchPtcList(),
      ]).finally(next);
    },
  },
);
