import { defineComponent, type VNode } from 'vue';
import { VMenu } from 'vuetify/components/VMenu';

export const Menu = defineComponent(function (p: {
  position: [number, number];
  content: () => VNode;
}) {
  return () => (
    <VMenu
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
