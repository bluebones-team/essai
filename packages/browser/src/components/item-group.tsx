import { useModel } from 'vue';
import { defineComponent, type VNode } from 'vue';
import { VItem, VItemGroup } from 'vuetify/components/VItemGroup';

export const ItemGroup = defineComponent(function <T, U extends boolean>(
  p: {
    mandatory?: boolean;
    multiple?: U;
    items: {
      value: T;
      comp: (slotProps: {
        isSelected: boolean | undefined;
        selectedClass: boolean | (string | undefined)[] | undefined;
        select: ((value: boolean) => void) | undefined;
        toggle: (() => void) | undefined;
        value: T;
        disabled: boolean | undefined;
      }) => VNode;
    }[];
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
        <VItem key={value + ''} value={value}>
          {{ default: comp }}
        </VItem>
      ))}
    </VItemGroup>
  );
});
