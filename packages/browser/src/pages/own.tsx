import {
  mdiAccountMultipleOutline,
  mdiArrowLeft,
  mdiClose,
  mdiDeleteOutline,
  mdiFileMultipleOutline,
  mdiPublish,
} from '@mdi/js';
import { watch } from '@vue/reactivity';
import {
  birth2age,
  ExperimentState,
  ExperimentType,
  Gender,
  Role,
} from 'shared/data';
import { computed, defineComponent, ref, toRef } from 'vue';
import { useDisplay } from 'vuetify';
import { VBtn } from 'vuetify/components/VBtn';
import { VBtnToggle } from 'vuetify/components/VBtnToggle';
import { VChip } from 'vuetify/components/VChip';
import { VFab } from 'vuetify/components/VFab';
import { VMain } from 'vuetify/components/VMain';
import { VToolbar } from 'vuetify/components/VToolbar';
import { Dialog } from '~/components/dialog';
import { ExperimentDetail } from '~/components/experiment';
import { Table } from '~/components/table';
import { c, useRequest } from '~/ts/client';
import {
  useCloned,
  useExperimentList,
  useFetchList,
  usePopup,
} from '~/ts/hook';
import { snackbar } from '~/ts/state';
import { definePageComponent, error } from '~/ts/util';

export const route: LooseRouteRecord = {
  meta: {
    nav: {
      tip: '管理',
      icon: mdiFileMultipleOutline,
      order: 4,
    },
    need: {
      login: true,
      role: Role.Recruiter.value,
    },
  },
};
const list = useExperimentList('own');
const readonly = computed(
  () => list.current && ExperimentState[list.current.state].readonly,
);

const _Table = defineComponent(() => {
  const deleteExpRequest = useRequest(
    '/exp/d',
    { eid: '' },
    {
      0(res) {
        list.remove({ eid: deleteExpRequest.input.eid });
      },
    },
  );
  return () => (
    <Table
      v-model={list.current}
      items={list.items}
      loading={list.request.loading}
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
        {
          title: '操作',
          key: '',
          width: '4rem',
          sortable: false,
          value: (item) => (
            <VBtn
              icon={mdiDeleteOutline}
              color="error"
              variant="text"
              loading={deleteExpRequest.loading}
              onClick={(e: MouseEvent) => {
                e.stopPropagation();
                deleteExpRequest.input.eid = item.eid;
              }}
            />
          ),
        },
      ]}
      slots={{
        toolbar: () => (
          <VToolbar>
            <VBtnToggle
              v-model={list.request.input.state}
              class="bg-surface mx-auto"
              density="compact"
              variant="outlined"
              divided
              mandatory
            >
              {ExperimentState.items.map((e) => (
                <VBtn value={e.value}>{e.text}</VBtn>
              ))}
            </VBtnToggle>
          </VToolbar>
        ),
        noData: () =>
          list.request.input.state !== void 0
            ? ExperimentState[list.request.input.state].noItem
            : null,
      }}
    />
  );
});
const Creator = defineComponent(() => {
  const defaultExpParams = {
    type: ExperimentType.Behavior.value,
    title: '一个很厉害的实验',
    notice: '一个很厉害的实验须知',
    position: { detail: '一个很厉害的实验室位置' },
  };
  const createExpRequest = useRequest('/exp/c', defaultExpParams, {
    0(res) {
      const newExp = Object.assign(defaultExpParams, {
        eid: res.data.eid,
        state: ExperimentState.Ready.value,
      });
      list.items.push(newExp);
      list.current = newExp;
    },
  });
  return () => (
    <VFab
      class="ms-4"
      icon="$plus"
      location="bottom end"
      absolute
      app
      //FIXME
      hidden={list.request.input.state === ExperimentState.Ready.value}
      loading={createExpRequest.loading}
      onClick={createExpRequest.fetch}
    />
  );
});
const _Detail = defineComponent(() => {
  const { mobile } = useDisplay();
  const isValid = ref(false);
  const {
    cloned: clonedExperment,
    isModified,
    sync,
    reset,
  } = useCloned(toRef(list, 'current'));

  function check() {
    if (!isValid.value) return error('表单验证错误');
    const tempModel = clonedExperment.value;
    if (!tempModel) return error('请选择实验');
    return tempModel!;
  }
  async function save() {
    const exp = check();
    if (isModified.value) {
      await c['/exp/u'].send(exp, {
        0(res) {
          sync();
          snackbar.show({ text: `${exp.title} 已保存`, color: 'success' });
        },
        _(res) {
          reset();
        },
      });
    } else {
      snackbar.show({ text: `${exp.title} 无需保存` });
    }
  }
  async function publish() {
    await save();
    const exp = check();
    c['/exp/pub'].send(
      { eid: exp.eid },
      {
        0(res) {
          exp.state = ExperimentState.Passed.value;
          snackbar.show({ text: `${exp.title} 已发布`, color: 'success' });
        },
      },
    );
  }
  return () => (
    <ExperimentDetail
      v-model={isValid.value}
      experiment={clonedExperment.value}
      readonly={readonly.value}
      slots={{
        append: () =>
          [
            mobile.value &&
              list.current?.state === ExperimentState.Passed.value && {
                text: '参与者',
                prependIcon: mdiAccountMultipleOutline,
                onClick: () => ptc_dialog.show(),
              },
            !readonly.value && {
              text: '发布',
              prependIcon: mdiPublish,
              onClick: publish,
              variant: 'outlined' as const,
              class: 'mr-4',
            },
          ].map((e) => e && <VBtn {...e} />),
      }}
    />
  );
});
const _PtcList = defineComponent((p: { rcid: string }) => {
  const { mobile } = useDisplay();
  const ptcList = useFetchList('/recruit/ptc/ls', {
    rcid: p.rcid,
    pn: 1,
    ps: 20,
  });
  const deletePtcRequest = useRequest(
    '/recruit/ptc/d',
    { rcid: p.rcid, uid: '' },
    {
      0(res) {
        ptcList.remove({ uid: deletePtcRequest.input.uid });
      },
    },
  );
  watch(
    () => p.rcid,
    () => (ptcList.request.input.rcid = p.rcid),
  );
  return () => (
    <Table
      v-model={ptcList.current}
      items={ptcList.items}
      loading={ptcList.request.loading}
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
          key: '',
          width: '4rem',
          sortable: false,
          value: (item) => (
            <VBtn
              icon={mdiClose}
              color="error"
              variant="text"
              size="small"
              onClick={(e: MouseEvent) => {
                e.stopPropagation();
                Object.assign(deletePtcRequest.input, {
                  rcid: p.rcid,
                  uid: item.uid,
                });
              }}
            />
          ),
        },
      ]}
      slots={{
        toolbar: () => [
          mobile.value && (
            <VBtn icon={mdiArrowLeft} onClick={ptc_dialog.close} />
          ),
        ],
        noData: () => '暂无参与者',
      }}
    />
  );
});
const ptc_dialog = usePopup(Dialog, () => ({ content: _PtcList }));

export default definePageComponent(
  import.meta.url,
  () => {
    const { mobile } = useDisplay();
    return () => (
      <VMain class={'h-100 d-grid ' + (mobile.value ? '' : 'grid-col-3')}>
        <div class="position-relative">
          <_Table />
          <Creator />
        </div>
        <_Detail />
        {mobile.value ? <ptc_dialog.Comp /> : <_PtcList />}
      </VMain>
    );
  },
  {
    beforeRouteEnter(to, from) {
      list.request.fetch();
    },
  },
);
