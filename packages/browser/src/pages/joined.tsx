import { mdiRun } from '@mdi/js';
import { ProjectType, RecruitmentType, Role } from 'shared/data';
import { defineComponent, provide, watchEffect } from 'vue';
import { useDisplay } from 'vuetify';
import { VBtn } from 'vuetify/components/VBtn';
import { VBtnToggle } from 'vuetify/components/VBtnToggle';
import { VChip } from 'vuetify/components/VChip';
import { VMain } from 'vuetify/components/VMain';
import { Dialog } from '~/components/dialog';
import { ProjectInfo } from '~/components/proj-info';
import { Table } from '~/components/table';
import { usePopup, useProjData } from '~/ts/hook';
import { injection } from '~/ts/state';

const { proj, fetchProjList, filter, simpleSearch } = useProjData('joined');

function _Table() {
  const { mobile } = useDisplay();
  return (
    <Table
      class={mobile.value ? 'w-100' : 'w-50'}
      v-model={proj.preview}
      items={proj.list}
      headers={[
        {
          title: '名称',
          key: 'title',
        },
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
        toolbar: () => (
          <VBtnToggle
            v-model={filter.data.rtype}
            onUpdate:modelValue={simpleSearch}
            class="mx-auto"
            density="compact"
            variant="outlined"
            divided
            mandatory
          >
            {RecruitmentType.items.map((e) => (
              <VBtn value={e.value}>{e.title}</VBtn>
            ))}
          </VBtnToggle>
        ),
      }}
    />
  );
}
function _Detail() {
  return (
    <ProjectInfo v-model={proj.data} onBack={() => detail_dialog.close()} />
  );
}

const detail_dialog = usePopup(Dialog, () => ({ content: _Detail }));
watchEffect(() => {
  if (proj.data) detail_dialog.show();
});

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
    fetchProjList().finally(next);
  },
  setup() {
    provide(injection.editable, false);
    const { mobile } = useDisplay();
    return () => (
      <VMain class="h-100 d-flex">
        <_Table />
        {mobile.value ? <detail_dialog.Comp /> : <_Detail class="w-50" />}
      </VMain>
    );
  },
});
