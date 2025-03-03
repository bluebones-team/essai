import { mdiArrowLeft, mdiMagnify, mdiTune } from '@mdi/js';
import {
  experiment,
  recruitment,
  recruitment_condition,
  type ExperimentFrontType,
} from 'shared/data';
import { defineComponent, watchEffect } from 'vue';
import { useDisplay } from 'vuetify';
import { VToolbar } from 'vuetify/components';
import { VBtn } from 'vuetify/components/VBtn';
import { VIcon } from 'vuetify/components/VIcon';
import { VTextField } from 'vuetify/components/VTextField';
import { useCloned, useCombinedBoolean, useModel, usePopup } from '~/ts/hook';
import { Dialog } from './dialog';
import { Form } from './form';
import { effect, watch } from '@vue/reactivity';

export const Experiment = defineComponent(function (p: {
  model: FTables['experiment'][ExperimentFrontType];
}) {
  const { xs } = useDisplay();
  return () => (
    <Form
      model={p.model}
      schema={experiment.front.public}
      layout={(comps) => [
        [
          { comp: comps.title, cols: () => (xs.value ? 12 : 6) },
          { comp: comps.type },
        ],
        [{ comp: comps.position }],
        [{ comp: comps.notice }],
      ]}
    />
  );
});
type Filter = FTables['experiment']['filter'];
export const ExperimentFilter = defineComponent(function (p: {
  range: Filter['range'];
  modelValue?: Filter['data'];
  'onUpdate:modelValue'?(value: Filter['data']): void;
}) {
  effect(() => {
    console.log(p.modelValue?.duration_range, p.range.duration_range);
  });

  const { xs } = useDisplay();
  const model = useModel(p);
  const { cloned, sync, reset } = useCloned(model);
  const FilterForm = defineComponent(function (p: {
    model: Filter['data'];
    range: Filter['range'];
  }) {
    return () => (
      <Form
        model={p.model}
        schema={experiment.front.filter.data}
        layout={(comps) => [
          [{ comp: () => <comps.search clearable autofocus /> }],
          [
            {
              cols: () => (xs.value ? 12 : 6),
              comp: () => <comps.type clearable />,
            },
            { comp: comps.rtype },
          ],
          [{ comp: () => <comps.fee_range range={p.range.fee_range} /> }],
          [{ comp: () => <comps.times_range range={p.range.times_range} /> }],
          [
            {
              comp: () => (
                <comps.duration_range range={p.range.duration_range} />
              ),
            },
          ],
        ]}
      />
    );
  });
  const dialog = usePopup(Dialog, () => ({
    content: () => <FilterForm model={cloned.value} range={p.range} />,
    btns: [
      { text: '重置', variant: 'outlined', onClick: reset },
      { text: '取消', variant: 'outlined', onClick: () => dialog.close() },
      {
        text: '确认',
        variant: 'flat',
        onClick() {
          sync();
          dialog.close();
        },
      },
    ],
  }));
  return () => (
    <>
      <dialog.Comp />
      <VTextField
        v-model={model.value.search}
        type="search"
        class="mx-4 w-100"
        variant="solo"
        placeholder="搜索"
        hideDetails
        onKeydown={(e: KeyboardEvent) => e.key === 'Enter' && sync()}
        v-slots={{
          'append-inner': () => [
            <VIcon class="mr-2" icon={mdiTune} onClick={() => dialog.show()} />,
            <VIcon icon={mdiMagnify} onClick={sync} />,
          ],
        }}
      />
    </>
  );
});
export const Recruitment = defineComponent(function (p: {
  model: FTables['recruitment'];
}) {
  return () => (
    <Form
      model={p.model}
      schema={recruitment.front}
      layout={(comps) => [
        [{ comp: comps.rtype }, { comp: comps.fee }],
        [{ comp: comps.notice }],
        [{ comp: comps.durations }],
      ]}
    />
  );
});
export const RecruitmentCondition = defineComponent(function (p: {
  model: FTables['recruitment_condition'];
}) {
  return () => (
    <Form
      model={p.model}
      schema={recruitment_condition.front}
      layout={(comps) => [[{ comp: comps.size }]]}
    />
  );
});
export const ExperimentDetail = defineComponent(function (p: {
  experiment?: FTables['experiment'][ExperimentFrontType];
  recruitments?: FTables['recruitment'][];
  slots?: Slots<VToolbar>;
  readonly?: boolean;
  modelValue?: boolean | null;
  'onUpdate:modelValue'?: (value: boolean | null) => void;
}) {
  const { mobile } = useDisplay();
  const { states, combined } = useCombinedBoolean();
  watchEffect(() => p['onUpdate:modelValue']?.(combined.value));
  watchEffect(() => p.experiment && dialog.show());
  const Detail = () => (
    <div class="flex-grow-1">
      <VToolbar
        title="实验详情页"
        v-slots={{
          prepend: () =>
            mobile.value && <VBtn icon={mdiArrowLeft} onClick={dialog.close} />,
          ...p.slots,
        }}
      />
      {p.experiment ? (
        <Experiment
          v-model={states[0]}
          readonly={p.readonly}
          model={p.experiment}
        />
      ) : null}
      {p.recruitments?.map((e) => (
        <Recruitment v-model={states[1]} model={e} readonly={p.readonly} />
      ))}
    </div>
  );
  const dialog = usePopup(Dialog, () => ({ content: Detail }));
  return () => (mobile.value ? dialog.Comp() : Detail());
});
