import { defineComponent, shallowReactive, useAttrs, watch } from 'vue';
import { VSnackbar } from 'vuetify/components/VSnackbar';
import { useDefaults, useList } from '~/ts/hook';

export const SnackbarQueue = defineComponent(
  function (props: {
    modelValue?: boolean;
    'onUpdate:modelValue'?: (value: boolean) => void;
    text?: string;
    color?: string;
  }) {
    const attrs = useAttrs();
    const p = useDefaults(props, { text: 'snackbar', color: 'primary' });
    const createItem = (function () {
      let shownNum = 0;
      return (pos: number) => {
        shownNum++;
        const state = shallowReactive({
          ...p,
          ...attrs,
          'onUpdate:modelValue'() {
            state.modelValue = false;
            setTimeout(() => {
              item.pos = 0;
              if (--shownNum === 0) {
                queue.clear();
                p['onUpdate:modelValue']?.(false);
              }
            }, 1e2);
          },
        });
        const item = { state, pos };
        return item;
      };
    })();
    const queue = useList<ReturnType<typeof createItem>>([]);
    watch(props, ({ modelValue }) => {
      if (!modelValue) return;
      let pos = 1;
      for (const item of queue.items.toSorted((a, b) => a.pos - b.pos)) {
        if (item.pos === 0) continue;
        if (item.pos === pos) pos++;
        else break;
      }
      queue.add(createItem(pos));
    });
    return () =>
      queue.items.map((e) => (
        <VSnackbar
          timeout={4e3}
          timer="#fff6"
          location="bottom right"
          style={{ bottom: `${e.pos * 3.3}rem` }}
          {...e.state}
        />
      ));
  },
  { inheritAttrs: false },
);
