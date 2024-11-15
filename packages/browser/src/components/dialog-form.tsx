import { defineComponent, h, type Component, type StyleValue } from 'vue';
import type { VCard } from 'vuetify/components/VCard';
import { useDefaults } from '~/ts/hook';
import { checkModel, pickModel } from '~/ts/util';
import { Dialog } from './dialog';
import { Form } from './form';

export const DialogForm = defineComponent(function (
  props: {
    card?: Props<VCard>;
    form?: Props<typeof Form> & { style?: StyleValue };
    content?: Component;
    submitText?: string;
    onPass?(): void;
    onCancel?(): void;
  } & {
    modelValue?: boolean;
    'onUpdate:modelValue'?(value: boolean): void;
  },
) {
  const _p = checkModel(props);
  const p = useDefaults(_p, {
    submitText: '提交',
    onCancel: () => _p['onUpdate:modelValue'](false),
    onPass: () => _p['onUpdate:modelValue'](false),
  });
  const _Form = () => (
    <Form
      actions={[
        {
          text: p.submitText,
          variant: 'flat',
          type: 'submit',
        },
        {
          text: '取消',
          variant: 'outlined',
          onClick: p.onCancel,
        },
      ]}
      onPass={p.onPass}
      {...p.form}
    >
      {p.content && h(p.content)}
    </Form>
  );
  return () => (
    <Dialog {...pickModel(props)} card={p.card} content={_Form}></Dialog>
  );
});
