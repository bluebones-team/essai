import {
  defineComponent,
  h,
  useModel,
  type Component,
  type StyleValue,
} from 'vue';
import type { VCard } from 'vuetify/components/VCard';
import { useDefaults } from '~/ts/hook';
import { Dialog } from './dialog';
import { Form } from './form';

export const DialogForm = defineComponent(function (
  _p: {
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
  const model = useModel(_p, 'modelValue');
  const p = useDefaults(_p, {
    submitText: '提交',
    onCancel: () => () => (model.value = false),
    onPass: () => () => (model.value = false),
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
    <Dialog v-model={model.value} card={p.card} content={_Form}></Dialog>
  );
});
