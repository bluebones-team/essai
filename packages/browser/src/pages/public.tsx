import { mdiAccountPlusOutline } from '@mdi/js';
import { ExperimentType, Role } from 'shared/data';
import { computed, defineComponent } from 'vue';
import { useDisplay } from 'vuetify';
import { VBtn } from 'vuetify/components/VBtn';
import { VChip } from 'vuetify/components/VChip';
import { VMain } from 'vuetify/components/VMain';
import { ExperimentDetail, ExperimentFilter } from '~/components/experiment';
import { Table, type TableHeader } from '~/components/table';
import { c } from '~/ts//client';
import { useExperimentData } from '~/ts/hook';
import { snackbar } from '~/ts/state';

const {
  exp,
  fetchList: fetchExpList,
  filter,
  fetchRange: fetchExpRange,
  search,
} = useExperimentData('public');

const _Table = defineComponent(() => {
  const { mobile, xs } = useDisplay();
  const mobileHeaders: TableHeader<
    FTables['experiment']['public']['preview']
  >[] = [
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
  const headers = computed(() =>
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
  return () => (
    <Table
      class={mobile.value ? 'w-100' : 'w-50'}
      v-model={exp.selected}
      items={exp.list}
      headers={headers.value}
      slots={{
        toolbar: () => (
          <ExperimentFilter
            model={filter.data}
            range={filter.range}
            onSearch={search}
          />
        ),
        noData: () => '当前区域没有项目',
      }}
    />
  );
});
const join = () => {
  if (!exp.selected)
    return snackbar.show({ text: '请先选择项目', color: 'error' });
  c['/exp/join'].send(
    { eid: exp.selected.eid, rtype: filter.data.rtype },
    {
      0(res) {
        snackbar.show({ text: '报名成功', color: 'success' });
      },
    },
  );
};

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
export default defineComponent({
  name: 'Public',
  beforeRouteEnter(to, from, next) {
    Promise.allSettled([fetchExpList(), fetchExpRange()]).finally(next);
  },
  setup() {
    return () => (
      <VMain class="d-flex h-100">
        <_Table />
        <ExperimentDetail
          experiment={exp.selected}
          recuitment={void 0}
          readonly
          slots={{
            append: () => [
              <VBtn
                text="报名"
                prependIcon={mdiAccountPlusOutline}
                variant="outlined"
                onClick={join}
              />,
            ],
          }}
        />
      </VMain>
    );
  },
});
