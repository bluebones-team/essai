import { defineComponent, h, useModel, type Component } from 'vue';
import { useDisplay } from 'vuetify';
import { VBtn } from 'vuetify/components/VBtn';
import { VCard, VCardActions } from 'vuetify/components/VCard';
import { VDialog } from 'vuetify/components/VDialog';

export const Dialog = defineComponent(function (
  p: {
    card?: Props<VCard>;
    btns?: Props<VBtn>[];
    content?: Component;
  } & {
    modelValue?: boolean;
    'onUpdate:modelValue'?(value: boolean): void;
  },
) {
  const { mobile } = useDisplay();
  const model = useModel(p, 'modelValue');
  return () => (
    <VDialog
      v-model={model.value}
      width={mobile.value ? '100vw' : 'auto'}
      fullscreen={mobile.value}
      persistent
    >
      <VCard {...p.card} disabled={!!p.card?.loading} rounded={!mobile.value}>
        {p.content && h(p.content)}
        {p.btns?.length && (
          <VCardActions class="px-6 pb-3 pt-0">
            {p.btns?.map((btnProps) => (
              <VBtn class="flex-grow-1" {...btnProps} />
            ))}
          </VCardActions>
        )}
      </VCard>
    </VDialog>
  );
});
