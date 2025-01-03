import { defineComponent, toValue, type VNode } from 'vue';
import { VCol, VContainer, VRow } from 'vuetify/components/VGrid';

export type ContainerLayout = {
  cols?: MaybeGetter<number>;
  comp: () => VNode | null;
}[][];
export const Container = defineComponent(
  (p: { layout: ContainerLayout }) => () => (
    <VContainer>
      {p.layout.map((configs) => (
        <VRow>
          {configs.map(({ cols, comp }) => (
            <VCol cols={toValue(cols)} v-slots={{ default: comp }} />
          ))}
        </VRow>
      ))}
    </VContainer>
  ),
);
