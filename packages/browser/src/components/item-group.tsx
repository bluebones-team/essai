import { defineComponent } from 'vue';
import { VItem, VItemGroup } from 'vuetify/components/VItemGroup';
import { pickModel } from '~/ts/util';

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
  return () => (
    <VItemGroup {...pickModel(p)} mandatory={p.mandatory} multiple={p.multiple}>
      {p.items.map(({ value, comp }) => (
        <VItem key={value + ''} value={value} v-slots={{ default: comp }} />
      ))}
    </VItemGroup>
  );
});
