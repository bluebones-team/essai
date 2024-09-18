import { defineComponent, useModel } from 'vue';
import { VItem, VItemGroup } from 'vuetify/components/VItemGroup';

export const ItemGroup = defineComponent(function <T, U extends boolean>(
  p: {
    mandatory?: boolean;
    multiple?: U;
    items: { value: T; comp: Slots<VItem>['default'] }[];
  } & {
    modelValue?: T;
    'onUpdate:modelValue'?: (v: T) => void;
  },
) {
  const model = useModel(p, 'modelValue');
  return () => (
    <VItemGroup
      v-model={model.value}
      mandatory={p.mandatory}
      multiple={p.multiple}
    >
      {p.items.map(({ value, comp }) => (
        <VItem key={value + ''} value={value} v-slots={{ default: comp }} />
      ))}
    </VItemGroup>
  );
});
