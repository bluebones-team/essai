import { mdiAccountPlusOutline } from '@mdi/js';
import { ExperimentType, Role } from 'shared/data';
import { computed } from 'vue';
import { useDisplay } from 'vuetify';
import { VBtn } from 'vuetify/components/VBtn';
import { VChip } from 'vuetify/components/VChip';
import { VMain } from 'vuetify/components/VMain';
import { ExperimentDetail, ExperimentFilter } from '~/components/experiment';
import { Table, type TableHeader } from '~/components/table';
import { useRequest } from '~/ts//client';
import { useExperimentList } from '~/ts/hook';
import { snackbar, store } from '~/ts/state';
import { definePageComponent } from '~/ts/util';

export const route: LooseRouteRecord = {
  meta: {
    nav: {
      tip: '报名',
      icon: mdiAccountPlusOutline,
      order: 2,
    },
    need: {
      login: false,
      role: Role.Participant.value,
    },
  },
};
const list = useExperimentList('public');
const joinRequest = useRequest(
  '/exp/join',
  { rcid: '' },
  {
    0(res) {
      snackbar.show({ text: '报名成功', color: 'success' });
    },
  },
);
store.add('publicList', list);

function useTableHeaders() {
  const { xs } = useDisplay();
  const mobileHeaders: TableHeader<FTables['experiment']['public']>[] = [
    { title: '标题', key: 'title', maxWidth: '20rem' },
    {
      title: '类型',
      key: 'type',
      // width: '6rem',
      value: (item) => (
        <VChip key={item.type} color={ExperimentType[item.type].color}>
          {ExperimentType[item.type].name}
        </VChip>
      ),
      //@ts-ignore
      sort: (a, b) => a.key - b.key,
    },
    // {
    //   title: '报酬',
    //   key: `recruitments[${filter.data.rtype}].fee` as any,
    //   minWidth: '6rem',
    //   value: (item) => {
    //     filter.data.rtype ??= RecruitmentType.Subject.value;
    //     return (
    //       <p key={item.recruitments[filter.data.rtype]?.fee}>
    //         {item.recruitments[filter.data.rtype]
    //           ? `￥ ${item.recruitments[filter.data.rtype]?.fee}`
    //           : '不招'}
    //       </p>
    //     );
    //   },
    //   //@ts-ignore
    //   sort: (a, b) => a.key - b.key,
    // },
  ];
  return computed(() =>
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
        ]),
  );
}
export default definePageComponent(
  import.meta.url,
  () => {
    const { mobile } = useDisplay();
    const headers = useTableHeaders();
    return () => (
      <VMain class="d-flex h-100">
        <Table
          class={mobile.value ? 'w-100' : 'w-50'}
          v-model={list.current}
          items={list.items}
          headers={headers.value}
          page={list.request.input}
          loading={list.request.loading}
          slots={{
            toolbar: () => (
              <ExperimentFilter
                v-model={list.request.input}
                range={list.filter.range}
              />
            ),
            noData: () => '当前区域没有项目',
          }}
        />
        <ExperimentDetail
          experiment={list.current}
          readonly
          slots={{
            append: () => [
              <VBtn
                text="报名"
                prependIcon={mdiAccountPlusOutline}
                variant="outlined"
                loading={joinRequest.loading}
                onClick={() => {
                  //FIXME
                  joinRequest.input.rcid = '';
                }}
              />,
            ],
          }}
        />
      </VMain>
    );
  },
  {
    beforeRouteEnter(to, from) {
      list.filter.request?.fetch();
      list.request.fetch();
    },
  },
);
