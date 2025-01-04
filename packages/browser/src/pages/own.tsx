import {
  mdiAccountMultipleOutline,
  mdiArrowLeft,
  mdiCheck,
  mdiClose,
  mdiContentSaveOutline,
  mdiDeleteOutline,
  mdiFileMultipleOutline,
  mdiPublish,
} from '@mdi/js';
import {
  birth_age,
  ExperimentState,
  ExperimentType,
  Gender,
  RecruitmentType,
  Role,
} from 'shared/data';
import { computed, defineComponent, ref, toRef, watchEffect } from 'vue';
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
import { c } from '~/ts/client';
import { useExperimentData, usePopup, useTempModel } from '~/ts/hook';
import { snackbar } from '~/ts/state';
import { error } from '~/ts/util';

const {
  exp,
  fetchList: fetchExpList,
  filter,
  search,
  ptc,
  fetchPtcList,
} = useExperimentData('own');
const readonly = computed(
  () => exp.selected && ExperimentState[exp.selected.state].readonly,
);

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
              c['/exp/remove'].send(
                { eid: item.eid },
                {
                  0(res) {
                    exp.list.splice(exp.list.indexOf(item), 1);
                  },
                },
              );
            }}
          />
        ),
      },
    ]}
    slots={{
      toolbar: () => (
        <VToolbar>
          <VBtnToggle
            v-model={filter.data.state}
            onUpdate:modelValue={search}
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
        filter.data.state !== void 0
          ? ExperimentState[filter.data.state].noItem
          : null,
    }}
  />
);
const _Fab = () =>
  filter.data.state === ExperimentState.Ready.value ? (
    <VFab
      class="ms-4"
      icon="$plus"
      location="bottom end"
      absolute
      app
      onClick={() => {
        c['/exp/add'].send(void 0, {
          0(res) {
            exp.list.push(res.data);
            exp.selected = res.data;
          },
        });
      }}
    />
  ) : null;
const _Detail = defineComponent(() => {
  const isValid = ref(false);
  const temp = useTempModel(toRef(exp, 'selected'));

  function check() {
    if (!isValid.value) return error('表单验证错误');
    const tempModel = temp.model.value;
    if (!tempModel) return error('请选择实验');
    return tempModel!;
  }
  async function save() {
    const exp = check();
    if (temp.hasChange.value) {
      await c['/exp/edit'].send(exp, {
        0(res) {
          temp.save();
          snackbar.show({ text: `${exp.title} 已保存`, color: 'success' });
        },
      });
    } else {
      snackbar.show({ text: `${exp.title} 无需保存` });
    }
  }
  async function publish() {
    await save();
    const exp = check();
    c['/exp/publish'].send(
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
      experiment={temp.model.value}
      readonly={readonly.value}
      slots={{
        append: () =>
          exp.selected?.state === ExperimentState.Passed.value
            ? [
                {
                  text: '参与者',
                  prependIcon: mdiAccountMultipleOutline,
                  onClick: () => ptc_dialog.show(),
                },
                // {
                //   text: '日程',
                //   prependIcon: mdiCalendarOutline,
                //   onClick: fetchSched,
                //   class: 'mr-4',
                // },
              ].map((e) => <VBtn {...e} />)
            : readonly.value
              ? []
              : [
                  {
                    text: '保存',
                    prependIcon: mdiContentSaveOutline,
                    onClick: save,
                  },
                  {
                    text: '发布',
                    prependIcon: mdiPublish,
                    onClick: publish,
                    variant: 'outlined' as const,
                    class: 'mr-4',
                  },
                ].map((e) => <VBtn {...e} />),
      }}
    />
  );
});
const _PtcList = () => {
  const { mobile } = useDisplay();
  return (
    <Table
      v-model={ptc.selected}
      items={ptc.list}
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
          value: (item) => birth_age(item.birthday),
        },
        {
          title: '操作',
          key: '' as any,
          width: '4rem',
          sortable: false,
          value: (item) => (
            <div class="d-flex">
              <VBtn
                icon={mdiCheck}
                color="success"
                variant="text"
                size="small"
                onClick={(e: MouseEvent) => {
                  e.stopPropagation();
                  c['/recruit/ptc/approve'].send(
                    { rtype: ptc.rtype, uid: item.uid },
                    { 0(res) {} },
                  );
                }}
              />
              <VBtn
                icon={mdiClose}
                color="error"
                variant="text"
                size="small"
                onClick={(e: MouseEvent) => {
                  e.stopPropagation();
                  c['/recruit/ptc/reject'].send(
                    { rtype: ptc.rtype, uid: item.uid },
                    {
                      0(res) {
                        ptc.list.splice(ptc.list.indexOf(item), 1);
                      },
                    },
                  );
                }}
              />
            </div>
          ),
        },
      ]}
      slots={{
        toolbar: () => [
          mobile.value && (
            <VBtn icon={mdiArrowLeft} onClick={ptc_dialog.close} />
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
        noData: () => '暂无参与者',
      }}
    />
  );
};

const ptc_dialog = usePopup(Dialog, () => ({ content: _PtcList }));
watchEffect(() => {
  if (exp.selected) {
    fetchPtcList();
  }
});

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
export default defineComponent({
  name: 'Own',
  beforeRouteEnter(to, from, next) {
    fetchExpList().finally(next);
  },
  setup() {
    const { mobile } = useDisplay();
    return () => (
      <VMain class={'h-100 d-grid ' + (mobile.value ? '' : 'grid-col-3')}>
        <div class="position-relative">
          <_Table />
          <_Fab />
        </div>
        <_Detail />
        {mobile.value ? <ptc_dialog.Comp /> : <_PtcList />}
      </VMain>
    );
  },
});
