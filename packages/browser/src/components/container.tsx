import { toComputed } from '~/ts/util';
import { defineComponent, type Component } from 'vue';
import { VCol, VContainer, VRow } from 'vuetify/components/VGrid';

export type ContainerDisplay = {
  cols?: MaybeGetter<number | undefined>;
  comp: Component;
}[][];

export const Container = defineComponent(
  (p: { display: ContainerDisplay }) => () => (
    <VContainer class="pb-0">
      {p.display.map((configs) => (
        <VRow>
          {configs.map(({ cols, comp }) => (
            //@ts-ignore
            <VCol cols={toComputed(cols).value} v-slots={{ default: comp }} />
          ))}
        </VRow>
      ))}
    </VContainer>
  ),
);
