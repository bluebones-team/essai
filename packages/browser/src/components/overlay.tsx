import { defineComponent, h, type Component } from 'vue';
import { VOverlay } from 'vuetify/components/VOverlay';

export const Overlay = defineComponent(function (p: {
  text?: string;
  comp?: Component;
}) {
  return () => (
    <VOverlay class="align-center justify-center" contained persistent>
      <h1 class="text-h1">{p.text}</h1>
      {h(p.comp ?? 'div')}
    </VOverlay>
  );
});
