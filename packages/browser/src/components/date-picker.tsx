import { mdiCalendar } from '@mdi/js';
import { r } from 'shared/valid';
import { defineComponent, ref, shallowRef, watchEffect } from 'vue';
import { VBtn } from 'vuetify/components/VBtn';
import { VDatePicker } from 'vuetify/components/VDatePicker';
import { VDialog } from 'vuetify/components/VDialog';
import { VTextField } from 'vuetify/components/VTextField';
import { Date2Timestamp, Timestamp2Date, dateFormat } from '~/ts/date';
import { useModel } from 'vue';
import { useDefaults } from '~/ts/hook';

export const DatePicker = defineComponent(function (
  _p: {
    label: string;
    readonly?: boolean;
  } & {
    modelValue?: Shared.Timestamp;
    'onUpdate:modelValue'?: (v: Shared.Timestamp) => void;
  },
) {
  const isOpen = ref(false);
  const p = useDefaults(_p, { modelValue: () => Date2Timestamp(new Date()) });
  const model = useModel(p, 'modelValue');
  const tempModel = shallowRef(new Date());
  /**@tutorial */
  const textModel = ref('');
  watchEffect(() => {
    textModel.value = dateFormat(model.value);
  });
  function setModel(value: string) {
    const date = new Date(value);
    if (!isNaN(+date)) {
      model.value = Date2Timestamp(date);
      textModel.value = dateFormat(date); //model无法及时更新，所以用date设置textModel
    } else {
      textModel.value = dateFormat(model.value);
    }
  }
  return () => (
    <>
      <VTextField
        v-model={textModel.value}
        rules={r.date().c}
        label={p.label}
        appendInnerIcon={mdiCalendar}
        onClick:appendInner={(e) => {
          if (p.readonly !== true) {
            tempModel.value = Timestamp2Date(model.value);
            isOpen.value = true;
          }
        }}
        //@ts-ignore
        onBlur={(e: FocusEvent) => setModel(e.target?.value)}
      />
      <VDialog width="auto" v-model={isOpen.value}>
        <VDatePicker
          class="w-100 overflow-auto"
          v-model={tempModel.value}
          hide-header
          hide-weekdays
          show-adjacent-months
        >
          {{
            actions: () => (
              <VBtn
                block
                text="确定"
                variant="flat"
                onClick={() => {
                  isOpen.value = false;
                  model.value = Date2Timestamp(tempModel.value);
                  textModel.value = dateFormat(tempModel.value);
                }}
              />
            ),
          }}
        </VDatePicker>
      </VDialog>
    </>
  );
});
