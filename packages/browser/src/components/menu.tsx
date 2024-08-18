import { useModel } from 'vue';
import { defineComponent, type VNode } from 'vue';
import { VMenu } from 'vuetify/components/VMenu';

export const Menu = defineComponent(function (
  p: {
    position: [number, number];
    content: () => VNode;
  } & {
    modelValue?: boolean;
    'onUpdate:modelValue'?: (v: boolean) => void;
  },
) {
  const model = useModel(p, 'modelValue');
  return () => (
    <VMenu
      v-model={model.value}
      class="position-absolute"
      style={{
        left: p.position[0] + 'px',
        top: p.position[1] + 'px',
      }}
    >
      {p.content()}
    </VMenu>
  );
});
