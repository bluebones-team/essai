import { FeedbackType } from 'shared/data';
import { ref } from 'vue';
import { VRadio } from 'vuetify/components/VRadio';
import { VRadioGroup } from 'vuetify/components/VRadioGroup';
import { VTextarea } from 'vuetify/components/VTextarea';
import { Container, type ContainerDisplay } from '~/components/container';

const type = ref<FeedbackType>(0);
export function Feedback() {
  const display: ContainerDisplay = [
    [
      {
        comp: () => (
          <VRadioGroup v-model={type.value} label="类型" inline hideDetails>
            {FeedbackType._items.map(({ title, _value }) => (
              <VRadio {...{ label: title, value: _value }} />
            ))}
          </VRadioGroup>
        ),
      },
    ],
    ...FeedbackType[type.value].display.map((props) => [
      { comp: () => <VTextarea {...props} /> },
    ]),
  ];
  return <Container display={display} />;
}
