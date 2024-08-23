import { mdiAccountPlusOutline, mdiInformationOutline } from '@mdi/js';
import { ProjectType, RecruitmentType } from 'shared/enum';
import { defineComponent, provide, watchEffect } from 'vue';
import { useDisplay } from 'vuetify';
import { VAlert } from 'vuetify/components/VAlert';
import { VBtn } from 'vuetify/components/VBtn';
import { VChip } from 'vuetify/components/VChip';
import { VMain } from 'vuetify/components/VMain';
import { VToolbar } from 'vuetify/components/VToolbar';
import { Dialog } from '~/components/dialog';
import { DialogForm } from '~/components/dialog-form';
import { AdvancedFilter, SimpleFilter } from '~/components/proj-filter';
import { ProjectInfo } from '~/components/proj-info';
import { Table, type TableHeader } from '~/components/table';
import { client } from '~/ts//client';
import { usePopup, useProjData } from '~/ts/hook';
import { injectSymbol, snackbar } from '~/ts/state';

const {
  proj,
  fetchProjList,
  filter,
  fetchProjRange,
  simpleSearch,
  advancedSearch,
} = useProjData('public');
const detail_dialog = usePopup(Dialog, () => ({ content: _Detail }));
const join_dialog = usePopup(Dialog, () => ({
  card: { title: '选择参与角色' },
  btns: [
    {
      text: '取消',
      variant: 'flat' as const,
      color: 'error',
      onClick: () => join_dialog.close(),
    },
  ],
  content: () => {
    const recruitments = proj.data?.recruitments;
    if (!recruitments?.length) {
      snackbar.show({ text: '该项目无招募信息' });
      return <div></div>;
    }
    return (
      <div class="center">
        {recruitments.map(({ rtype }) => {
          const e = RecruitmentType[rtype];
          return (
            <VBtn text={e.title} color={e.color} onClick={() => join(rtype)} />
          );
        })}
      </div>
    );
  },
}));
const search_dialog = usePopup(DialogForm, () => ({
  card: { title: '高级搜索' },
  form: { size: 'large' as const },
  submitText: '确认',
  content: () => <AdvancedFilter v-model={filter.data} range={filter.range} />,
  onPass() {
    advancedSearch();
    search_dialog.close();
  },
}));
watchEffect(() => {
  if (proj.data) detail_dialog.show();
});
function join(rtype: RecruitmentType, starts?: Shared.Timestamp[]) {
  if (starts instanceof Event) starts = void 0;
  const data = proj.data;
  if (!data) return snackbar.show({ text: '请先选择项目', color: 'error' });
  const send = () =>
    new client('proj/join', { pid: data.pid, rtype, starts }).send({
      0(res) {
        snackbar.show({ text: '报名成功', color: 'success' });
      },
    });
  if (data.recruitments[rtype]?.should_select_event) {
    snackbar.show({ text: '暂不支持该功能', color: 'info' });
  } else send();
}
function _Detail() {
  return (
    <ProjectInfo
      v-model={proj.data}
      onBack={detail_dialog.close}
      actions={[
        {
          text: '报名',
          prependIcon: mdiAccountPlusOutline,
          onClick() {
            join_dialog.show();
          },
        },
      ]}
    />
  );
}

export default defineComponent({
  name: 'Public',
  beforeRouteEnter(to, from, next) {
    Promise.allSettled([fetchProjList(), fetchProjRange()]).finally(next);
  },
  setup() {
    provide(injectSymbol.editable, { value: false });
    const { mobile, xs } = useDisplay();
    const mobileHeaders: TableHeader<Project['public']['Preview']>[] = [
      { title: '标题', key: 'title', maxWidth: '20rem' },
      {
        title: '类型',
        key: 'type',
        // width: '6rem',
        value: (item) => (
          <VChip key={item.type} color={ProjectType[item.type].color}>
            {ProjectType[item.type]._name}
          </VChip>
        ),
        //@ts-ignore
        sort: (a, b) => a.key - b.key,
      },
      {
        title: '报酬',
        key: `recruitments[${filter.data.rtype}].fee` as any,
        minWidth: '6rem',
        value: (item) => {
          filter.data.rtype ??= RecruitmentType.Subject._value;
          return (
            <p key={item.recruitments[filter.data.rtype]?.fee}>
              {item.recruitments[filter.data.rtype]
                ? `￥ ${item.recruitments[filter.data.rtype]?.fee}`
                : '不招'}
            </p>
          );
        },
        //@ts-ignore
        sort: (a, b) => a.key - b.key,
      },
    ];
    return () => (
      <VMain class="d-flex h-100 overflow-auto">
        <search_dialog.Comp />
        <join_dialog.Comp />
        <Table
          class={mobile.value ? 'w-100' : 'w-50'}
          v-model={proj.preview}
          items={proj.list}
          headers={
            xs.value
              ? mobileHeaders
              : mobileHeaders.concat([
                  {
                    title: '位置',
                    key: 'position',
                    value: (item) => item.position.detail,
                    cellProps: {
                      style: {
                        textOverflow: 'ellipsis',
                        overflow: 'hidden',
                        whiteSpace: 'nowrap',
                      },
                    },
                  },
                ])
          }
          v-slots={{
            toolbar: () => (
              <VToolbar color="primary">
                <SimpleFilter
                  v-model={filter.data.search}
                  onSearch={simpleSearch}
                  onShow:advanced={() => {
                    search_dialog.show();
                  }}
                />
              </VToolbar>
            ),
            noData: () => (
              <VAlert title="当前区域没有项目" icon={mdiInformationOutline} />
            ),
          }}
        ></Table>
        {mobile.value ? <detail_dialog.Comp /> : <_Detail class="w-50" />}
      </VMain>
    );
  },
});
