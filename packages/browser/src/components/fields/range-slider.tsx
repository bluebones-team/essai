import { defineComponent } from 'vue';
import { VRangeSlider } from 'vuetify/components/VRangeSlider';
import { useModel } from '~/ts/hook';
import { NumberInput } from './number-input';

const NumInput = defineComponent(() => () => (
  <NumberInput
    style="width: 4rem"
    variant="outlined"
    density="compact"
    hideDetails
    singleLine
  />
));
export const RangeSlider = defineComponent(function (p: {
  modelValue?: [number, number];
  'onUpdate:modelValue'?: (value: [number, number]) => void;
  range?: [number, number];
}) {
  const model = useModel(p, 'modelValue');
  return () => (
    <VRangeSlider
      v-model={model.value}
      type="number"
      step={1}
      min={p.range?.[0]}
      max={p.range?.[1]}
      strict
      thumbLabel
      v-slots={{
        prepend: () => <NumInput v-model={model.value[0]} />,
        append: () => <NumInput v-model={model.value[1]} />,
      }}
    />
  );
});
