import { toComputed } from '~/ts/util';
import { defineComponent, type Component } from 'vue';
import { VCol, VContainer, VRow } from 'vuetify/components/VGrid';

export type ContainerDisplay = {
  cols?: MaybeGetter<number | undefined>;
  comp: Component;
}[][];

export const Container = defineComponent(function (props: {
  display: MaybeGetter<ContainerDisplay>;
}) {
  return () => (
    <VContainer class="pb-0">
      {toComputed(props.display).value.map((configs) => (
        <VRow>
          {configs.map(({ cols, comp }) => (
            //@ts-ignore
            <VCol
              cols={toComputed(cols).value}
              v-slots={{ default: comp }}
            ></VCol>
          ))}
        </VRow>
      ))}
    </VContainer>
  );
});
