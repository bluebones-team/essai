import { defineComponent, useModel } from 'vue';
import { VTextField } from 'vuetify/components/VTextField';
import { checkModel } from '~/ts/util';

export const NumberInput = defineComponent(function (p: {
  modelValue?: number;
  'onUpdate:modelValue'?: (value: number) => void;
}) {
  const model = useModel(checkModel(p), 'modelValue', {
    get: (v) => '' + v,
    set: (v) => +v,
  });
  return () => <VTextField v-model={model.value} type="number" />;
});
