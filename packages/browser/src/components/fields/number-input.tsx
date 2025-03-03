import { defineComponent } from 'vue';
import { VTextField } from 'vuetify/components/VTextField';
import { useModel } from '~/ts/hook';

export const NumberInput = defineComponent(function (p: {
  modelValue?: number;
  'onUpdate:modelValue'?: (value: number) => void;
}) {
  const model = useModel(p, 'modelValue', {
    get: (v) => '' + v,
    set: (v) => +v,
  });
  return () => <VTextField v-model={model.value} type="number" />;
});
