import {
  mdiAccountMultipleOutline,
  mdiArrowLeft,
  mdiContentSaveOutline,
  mdiDeleteOutline,
  mdiInformationOutline,
  mdiPublish,
} from '@mdi/js';
import {
  Gender,
  ProjectState,
  ProjectType,
  RecruitmentType,
} from 'shared/enum';
import {
  computed,
  defineComponent,
  provide,
  reactive,
  toRef,
  watchEffect,
} from 'vue';
import { useDisplay } from 'vuetify';
import { VAlert } from 'vuetify/components/VAlert';
import { VBtn } from 'vuetify/components/VBtn';
import { VBtnToggle } from 'vuetify/components/VBtnToggle';
import { VChip } from 'vuetify/components/VChip';
import { VFab } from 'vuetify/components/VFab';
import { VMain } from 'vuetify/components/VMain';
import { VToolbar } from 'vuetify/components/VToolbar';
import { Dialog } from '~/components/dialog';
import { ProjectInfo } from '~/components/proj-info';
import { Table } from '~/components/table';
import { client } from '~/ts/client';
import { Birthday2Age } from '~/ts/date';
import { usePopup, useProjData, useTempModel, useValid } from '~/ts/hook';
import { injectSymbol, snackbar } from '~/ts/state';

const { proj, fetchProjList, filter, simpleSearch, ptc, fetchPtcList } =
  useProjData('own');
const detail_dialog = usePopup(Dialog, () => ({ content: _Detail }));
watchEffect(() => {
  if (proj.data) {
    detail_dialog.show();
    fetchPtcList();
  }
});
const ptc_dialog = usePopup(Dialog, () => ({ content: _PtcList }));

const editable = computed(
  () => !proj.preview || ProjectState[proj.preview.state].editable,
);
const temp = useTempModel(toRef(proj, 'data'));
const state = reactive({
  isPasses: [] as boolean[],
  actions: computed<Props<typeof ProjectInfo>['actions']>(() => {
    if (!proj.data) return;
    return editable.value
      ? [
          {
            text: '保存',
            prependIcon: mdiContentSaveOutline,
            onClick: save,
          },
          {
            text: '发布',
            prependIcon: mdiPublish,
            onClick: publish,
            variant: 'outlined',
            class: 'mr-4',
          },
        ]
      : proj.data.state === ProjectState.Passed._value
        ? [
            {
              text: '参与者',
              prependIcon: mdiAccountMultipleOutline,
              onClick: ptc_dialog.show,
            },
            // {
            //   text: '日程',
            //   prependIcon: mdiCalendarOutline,
            //   onClick: fetchSched,
            //   class: 'mr-4',
            // },
          ]
        : void 0;
  }),
  participants: [] as Participant.Join[],
});
const isPass = useValid(toRef(state, 'isPasses'));

function check() {
  if (!isPass) throw snackbar.show({ text: '表单验证错误', color: 'error' });
  const tempModel = temp.model.value;
  if (!tempModel)
    throw snackbar.show({ text: 'no temp model', color: 'error' });
  if (!tempModel.recruitments.length)
    throw snackbar.show({ text: '至少有一个招募信息', color: 'error' });
  return tempModel;
}
async function save() {
  const tempModel = check();
  if (temp.hasChange.value) {
    await new client('proj/edit', tempModel).send({
      0(res) {
        temp.save();
        snackbar.show({
          text: `${tempModel?.title} 已保存`,
          color: 'success',
        });
      },
    });
  } else {
    snackbar.show({ text: `${tempModel.title} 无需保存` });
  }
}
async function publish() {
  await save();
  const tempModel = check();
  if (!tempModel) return;
  new client('proj/publish', { pid: tempModel.pid }).send({
    0(res) {
      tempModel.state = ProjectState.Passed._value;
      snackbar.show({ text: `${tempModel.title} 已发布`, color: 'success' });
    },
  });
}

const _Detail = () => (
  <ProjectInfo
    v-model={temp.model.value}
    v-model:isPass={state.isPasses}
    onBack={detail_dialog.close}
    actions={state.actions}
  />
);
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
          value: (item) => Gender[item.gender].title,
        },
        {
          title: '年龄',
          key: 'birthday',
          value: (item) => Birthday2Age(item.birthday),
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
                new client('ptc/reject', {
                  rtype: ptc.rtype,
                  uid: item.uid,
                }).send({
                  0(res) {
                    ptc.list.splice(ptc.list.indexOf(item), 1);
                  },
                });
              }}
            ></VBtn>
          ),
        },
      ]}
      v-slots={{
        toolbar: () => (
          <VToolbar>
            {mobile.value && (
              <VBtn icon={mdiArrowLeft} onClick={ptc_dialog.close} />
            )}
            <VBtnToggle
              v-model={ptc.rtype}
              onUpdate:modelValue={fetchPtcList}
              class="bg-surface mx-auto"
              density="compact"
              variant="outlined"
              divided
              mandatory
            >
              {proj.data?.recruitments.map(({ rtype }) => {
                const e = RecruitmentType[rtype];
                return <VBtn value={e._value}>{e.title}</VBtn>;
              })}
            </VBtnToggle>
          </VToolbar>
        ),
        noData: () => (
          <VAlert title="暂无参与者" icon={mdiInformationOutline} />
        ),
      }}
    />
  );
};

export default defineComponent({
  name: 'Own',
  beforeRouteEnter(to, from, next) {
    fetchProjList().finally(next);
  },
  setup() {
    provide(injectSymbol.editable, editable);
    const { mobile } = useDisplay();
    return () => (
      <VMain class={'h-100 d-grid ' + (mobile.value ? '' : 'grid-col-3')}>
        <div class="position-relative">
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
                    {ProjectType[item.type]._name}
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
                      new client('proj/remove', { pid: item.pid }).send({
                        0(res) {
                          proj.list.splice(proj.list.indexOf(item), 1);
                        },
                      });
                    }}
                  ></VBtn>
                ),
              },
            ]}
            v-slots={{
              toolbar: () => (
                <VToolbar>
                  <VBtnToggle
                    v-model={filter.data.state}
                    onUpdate:modelValue={simpleSearch}
                    class="bg-surface mx-auto"
                    density="compact"
                    variant="outlined"
                    divided
                    mandatory
                  >
                    {ProjectState._items.map((e) => (
                      <VBtn value={e._value}>{e.title}</VBtn>
                    ))}
                  </VBtnToggle>
                </VToolbar>
              ),
              noData: () => (
                <VAlert
                  title={ProjectState[filter.data.state].noItem}
                  icon={mdiInformationOutline}
                />
              ),
            }}
          />
          {filter.data.state === ProjectState.Ready._value && (
            <VFab
              class="ms-4"
              icon="$plus"
              location="bottom end"
              absolute
              app
              onClick={() => {
                new client('proj/add', null).send({
                  0(res) {
                    proj.list.push(res.data);
                    proj.preview = res.data;
                  },
                });
              }}
            />
          )}
        </div>
        {mobile.value ? <detail_dialog.Comp /> : <_Detail />}
        {mobile.value ? <ptc_dialog.Comp /> : <_PtcList />}
      </VMain>
    );
  },
});
