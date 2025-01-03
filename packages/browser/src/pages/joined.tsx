import { mdiRun } from '@mdi/js';
import { ExperimentType, RecruitmentType, Role } from 'shared/data';
import { defineComponent } from 'vue';
import { useDisplay } from 'vuetify';
import { VBtn } from 'vuetify/components/VBtn';
import { VBtnToggle } from 'vuetify/components/VBtnToggle';
import { VChip } from 'vuetify/components/VChip';
import { VMain } from 'vuetify/components/VMain';
import { ExperimentDetail } from '~/components/experiment';
import { Table } from '~/components/table';
import { useExperimentData } from '~/ts/hook';

const {
  exp,
  fetchList: fetchExpList,
  filter,
  search,
} = useExperimentData('joined');

function _Table() {
  const { mobile } = useDisplay();
  return (
    <Table
      class={mobile.value ? 'w-100' : 'w-50'}
      v-model={exp.selected}
      items={exp.list}
      headers={[
        {
          title: '名称',
          key: 'title',
        },
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
        toolbar: () => (
          <VBtnToggle
            v-model={filter.data.rtype}
            onUpdate:modelValue={search}
            class="mx-auto"
            density="compact"
            variant="outlined"
            divided
            mandatory
          >
            {RecruitmentType.items.map((e) => (
              <VBtn value={e.value}>{e.text}</VBtn>
            ))}
          </VBtnToggle>
        ),
      }}
    />
  );
}

export const route: LooseRouteRecord = {
  meta: {
    nav: {
      tip: '正在参加',
      icon: mdiRun,
      order: 3,
    },
    need: {
      login: true,
      role: Role.Participant.value,
    },
  },
};
export default defineComponent({
  name: 'Joined',
  beforeRouteEnter(to, from, next) {
    fetchExpList().finally(next);
  },
  setup() {
    return () => (
      <VMain class="h-100 d-flex">
        <_Table />
        <ExperimentDetail
          experiment={exp.selected}
          recuitment={void 0}
          readonly
        />
      </VMain>
    );
  },
});
