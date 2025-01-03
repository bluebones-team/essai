import { defineComponent, h, type Component } from 'vue';
import { useDisplay } from 'vuetify';
import { VBtn } from 'vuetify/components/VBtn';
import { VCard, VCardActions } from 'vuetify/components/VCard';
import { VDialog } from 'vuetify/components/VDialog';
import { pickModel } from '~/ts/util';

export const Dialog = defineComponent(function (p: {
  card?: Props<VCard>;
  btns?: Props<VBtn>[];
  content?: Component;
  modelValue?: boolean;
  'onUpdate:modelValue'?(value: boolean): void;
}) {
  const { mobile } = useDisplay();
  return () => (
    <VDialog
      {...pickModel(p)}
      scrollable
      fullscreen={mobile.value}
      persistent
      transition={mobile.value ? 'slide-x-reverse-transition' : void 0}
    >
      <VCard {...p.card} disabled={!!p.card?.loading} rounded={!mobile.value}>
        {p.content && h(p.content)}
        {p.btns?.length && (
          <VCardActions class="px-6 pb-3 pt-0">
            {p.btns?.map((nav) => <VBtn class="flex-grow-1" {...nav} />)}
          </VCardActions>
        )}
      </VCard>
    </VDialog>
  );
});
