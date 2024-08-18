import { ProjectType, RecruitmentType } from 'shared/enum';
import { defineComponent, provide, watchEffect } from 'vue';
import { useDisplay } from 'vuetify';
import { VBtn } from 'vuetify/components/VBtn';
import { VBtnToggle } from 'vuetify/components/VBtnToggle';
import { VChip } from 'vuetify/components/VChip';
import { VMain } from 'vuetify/components/VMain';
import { VToolbar } from 'vuetify/components/VToolbar';
import { Dialog } from '~/components/dialog';
import { ProjectInfo } from '~/components/proj-info';
import { Table } from '~/components/table';
import { usePopup, useProjData } from '~/ts/hook';
import { injectSymbol } from '~/ts/state';

const { proj, fetchProjList, filter, simpleSearch } = useProjData('joined');
const {
  Comp: _Dialog,
  show,
  close,
} = usePopup(Dialog, () => ({ content: _Detail }));
watchEffect(() => {
  if (proj.data) show();
});
function _Detail() {
  return <ProjectInfo v-model={proj.data} onBack={close} />;
}

export default defineComponent({
  name: 'Joined',
  beforeRouteEnter(to, from, next) {
    fetchProjList().finally(next);
  },
  setup() {
    provide(injectSymbol.editable, { value: false });
    const { mobile } = useDisplay();
    return () => (
      <VMain class="h-100 d-flex">
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
                  {ProjectType[item.type]._name}
                </VChip>
              ),
            },
          ]}
          v-slots={{
            toolbar: () => (
              <VToolbar>
                <VBtnToggle
                  v-model={filter.data.rtype}
                  onUpdate:modelValue={simpleSearch}
                  class="mx-auto"
                  density="compact"
                  variant="outlined"
                  divided
                >
                  {RecruitmentType._items.map((e) => (
                    <VBtn value={e._value}>{e.title}</VBtn>
                  ))}
                </VBtnToggle>
              </VToolbar>
            ),
          }}
        />
        {mobile.value ? <_Dialog /> : <_Detail class="w-50" />}
      </VMain>
    );
  },
});
