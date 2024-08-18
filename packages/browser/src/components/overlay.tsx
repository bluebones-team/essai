import { defineComponent, h, type Component } from 'vue';
import { VOverlay } from 'vuetify/components/VOverlay';
import { useModel } from 'vue';

export const Overlay = defineComponent(function (
  p: {
    text?: string;
    comp?: Component;
  } & {
    modelValue?: boolean;
    'onUpdate:modelValue'?: (v: boolean) => void;
  },
) {
  const model = useModel(p, 'modelValue');
  return () => (
    <VOverlay
      v-model={model.value}
      class="align-center justify-center"
      contained
      persistent
    >
      <h1 class="text-h1">{p.text}</h1>
      {h(p.comp ?? 'div')}
    </VOverlay>
  );
});
