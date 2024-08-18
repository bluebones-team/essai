import { CardType } from 'shared/enum';
import { r } from 'shared/valid';
import { VSelect } from 'vuetify/components/VSelect';
import { VTextField } from 'vuetify/components/VTextField';
import { Container, type ContainerDisplay } from '~/components/container';
import { useModel } from 'vue';
import { useDefaults } from '~/ts/hook';

type Date = { name: string; type: CardType; num: string };
export function RealnameInput(p: ModelProps<Date>) {
  const model = useModel(
    useDefaults(p, {
      modelValue: () => ({ name: '', type: CardType.IDCard._value, num: '' }),
    }),
    'modelValue',
  );
  const display: ContainerDisplay = [
    [
      {
        comp: () => (
          <VTextField
            v-model={model.value.name}
            label="真实姓名"
            rules={r.str().c}
          />
        ),
      },
      {
        cols: 12,
        comp: () => (
          <VSelect
            v-model={model.value.type}
            label="证件类型"
            rules={r.num().c}
            items={CardType._items}
          />
        ),
      },
      {
        comp: () => (
          <VTextField
            v-model={model.value.num}
            label="证件号"
            rules={r.str().c}
          />
        ),
      },
    ],
  ];
  return <Container display={display} />;
}
