import { RptProjectType, RptUserType } from 'shared/enum';
import { r } from 'shared/valid';
import { useModel } from 'vue';
import { VRadio } from 'vuetify/components/VRadio';
import { VRadioGroup } from 'vuetify/components/VRadioGroup';
import { VTextarea } from 'vuetify/components/VTextarea';
import { Container, type ContainerDisplay } from '~/components/container';
import { useDefaults } from '~/ts/hook';

const options = { proj: RptProjectType, user: RptUserType };
export function ReportInput<T extends keyof typeof options>(
  p: { type: T } & ModelProps<
    {
      proj: { type: RptProjectType; content: string };
      user: { type: RptUserType; content: string };
    }[T]
  >,
) {
  const model = useModel(
    useDefaults(p, {
      modelValue: () => ({ type: 0, content: '' }),
    }),
    'modelValue',
  );
  const display: ContainerDisplay = [
    [
      {
        comp: () => (
          <VRadioGroup
            v-model={model.value.type}
            label="举报类型"
            rules={r.num().c}
            inline
            hideDetails
          >
            {options[p.type]._items.map(({ title, _value }) => (
              <VRadio {...{ label: title, value: _value }} />
            ))}
          </VRadioGroup>
        ),
      },
      {
        cols: 12,
        comp: () => (
          <VTextarea
            v-model={model.value.content}
            label="举报理由"
            rules={r.str().min(4).content().c}
            rows={3}
            counter
            autoGrow
          />
        ),
      },
    ],
  ];
  return <Container display={display} />;
}
