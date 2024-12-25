import { mdiArrowLeft } from '@mdi/js';
import { toFieldRules } from 'shared';
import {
  experiment,
  ExperimentType,
  recruitment,
  recruitment_condition,
  RecruitmentType,
  shared,
  type ExperimentDataType,
} from 'shared/data';
import { computed, defineComponent, reactive, useAttrs, useModel } from 'vue';
import { useDisplay } from 'vuetify';
import { VBtn } from 'vuetify/components/VBtn';
import { VSpacer } from 'vuetify/components/VGrid';
import { VSelect } from 'vuetify/components/VSelect';
import { VTextField } from 'vuetify/components/VTextField';
import { VTextarea } from 'vuetify/components/VTextarea';
import { VToolbar, VToolbarTitle } from 'vuetify/components/VToolbar';
import { VScrollYReverseTransition } from 'vuetify/components/transitions';
import { Container, type ContainerDisplay } from '~/components/container';
import { Form } from '~/components/form';
import { Section } from '~/components/section';
import { checkModel } from '~/ts/util';

const expValid = toFieldRules(experiment.front.public.data);
const recruitmentConditionValid = toFieldRules(recruitment_condition.front);
const recruitmentValid = toFieldRules(recruitment.front);
const positionValid = toFieldRules(shared.position);

function useBaseDisplay(
  data: FTables['experiment'][ExperimentDataType]['data'],
): ContainerDisplay {
  const { xs } = useDisplay();
  return [
    [
      {
        cols: () => (xs.value ? 12 : 6),
        comp: () => (
          <VTextField
            v-model={data.title}
            label="项目名称"
            maxlength="20"
            rules={expValid.title}
            counter
          />
        ),
      },
      {
        comp: () => (
          <VSelect
            v-model={data.type}
            label="类型"
            items={ExperimentType.items.map((e) => ({
              title: e.name,
              subtitle: e.title,
              value: e.value,
            }))}
            itemProps
            rules={expValid.type}
            persistentHint
            hint={ExperimentType[data.type].title}
          />
        ),
      },
      // {
      //   cols: 6,
      //   comp: () => (
      //     <VSelect
      //       v-model={data.position.district}
      //       label="地理区域"
      //       items={Districts}
      //     />
      //   ),
      // },
      {
        cols: 12,
        comp: () => (
          <VTextField
            v-model={data.position.detail}
            label="详细地址"
            rules={positionValid.detail}
          />
        ),
      },
      // {
      //     comp: () => (
      //         <VTextField v-model={data.consent} label="知情同意书" />
      //     ),
      // },
      {
        cols: 12,
        comp: () => (
          <VTextarea
            v-model={data.notice}
            label="项目介绍"
            maxlength={100}
            rows={3}
            rules={expValid.notice}
            autoGrow
            counter
          />
        ),
      },
    ],
  ];
}
// function useEventDisplay(
//   events: FTables['experiment'][ExperimentDataType]['data']['events'],
// ): ContainerDisplay {
//   const editable = toComputed(inject(injection.editable, true));
//   const event = events[0];
//   const { xs } = useDisplay();
//   return [
//     [
//       {
//         cols: () => (xs.value ? 12 : 6),
//         comp: () => (
//           <VDateInput
//             v-model={event[0]}
//             label="开始日期"
//             readonly={!editable.value}
//           />
//         ),
//       },
//       {
//         comp: () => (
//           <VDateInput
//             v-model={event[1]}
//             label="结束日期"
//             readonly={!editable.value}
//           />
//         ),
//       },
//     ],
//   ];
// }
function useRecruitmentDisplay<T extends FTables['recruitment'][]>(
  recruitments: T,
  type: RecruitmentType,
): ContainerDisplay {
  const data = recruitments.find((e) => e.rtype === type);
  if (!data) return [];
  const { xs } = useDisplay();
  return [
    [
      {
        cols: () => (xs.value ? 6 : 4),
        comp: () => (
          <VTextField
            v-model={data.conditions[0]['size']}
            label="招募人数"
            type="number"
            rules={recruitmentConditionValid.size}
          />
        ),
      },
      {
        cols: () => (xs.value ? 6 : 4),
        comp: () => (
          <VTextField
            v-model={data.fee}
            label="报酬"
            type="number"
            rules={recruitmentValid.fee}
            prefix="￥"
          />
        ),
      },
      // {
      //   cols: 6,
      //   comp: () => (
      //     <VTextField
      //       v-model={data.max_concurrency}
      //       label="实验室最多同时实验人数"
      //       type="number"
      //       rules={r.num().min(1).max(999).c}
      //     />
      //   ),
      // },
      // {
      //   cols: 6,
      //   comp: () => (
      //     <VSwitch
      //       v-model={data.should_select_event}
      //       label="报名时应选择日程"
      //       hideDetails
      //     />
      //   ),
      // },
      {
        comp: () => (
          <VTextField
            {...{
              label: '参加次数',
              type: 'number',
              hint: '需要前往实验室的次数',
              modelValue: data.durations.length,
              'onUpdate:modelValue'(_v: string) {
                const v = +_v;
                if (v > 0 && v < 5) {
                  data.durations.length = v;
                  data.durations.fill(data.durations[0]);
                }
              },
            }}
          />
        ),
      },
    ],
    data.durations.map((e, i) => ({
      cols: () => (xs.value ? 12 : void 0),
      comp: () => (
        <VTextField
          v-model={data.durations[i]}
          {...{
            label: `第${i + 1}次${i ? '' : ' (实验时长)'}`,
            // placeholder: '实验时长',
            type: 'number',
            rules: [(v) => recruitmentValid.durations[0]([v])],
            // hint: '单位: min',
            suffix: 'min',
          }}
        />
      ),
    })),
  ];
}

const FormSection = defineComponent(function (p: {
  title: string;
  subtitle?: string;
  display: ContainerDisplay;
}) {
  /**@see https://cn.vuejs.org/guide/components/attrs.html */
  const attrs = useAttrs();
  return () => (
    <Section
      title={p.title}
      items={[
        {
          title: p.subtitle,
          comp: () => (
            <Form {...attrs}>
              <Container display={p.display} />
            </Form>
          ),
        },
      ]}
    ></Section>
  );
});
export const ProjectInfo = defineComponent(function (
  p: {
    actions?: Props<VBtn>[];
    onBack?(): void;
    onSave?(data: FTables['experiment'][ExperimentDataType]['data']): void;
    onPublish?(data: FTables['experiment'][ExperimentDataType]['data']): void;
  } & {
    modelValue?: FTables['experiment'][ExperimentDataType]['data'];
    'onUpdate:modelValue'?: (
      value: FTables['experiment'][ExperimentDataType]['data'],
    ) => void;
  } & {
    isPasses?: boolean[];
    'onUpdate:isPasses'?: (value: boolean[]) => void;
  },
) {
  const { mobile } = useDisplay();
  const model = useModel(checkModel(p), 'modelValue');
  const state = reactive({
    // model,
    isPass: useModel(p, 'isPasses', { get: (v) => v ?? [] }),
    panels: computed(() => [
      { title: '基本', display: useBaseDisplay(model.value) },
      // {
      //   title: '日程',
      //   display: useEventDisplay(model.value.events),
      // },O
      ...model.value.recruitments.map((e, i, arr) => ({
        title: i ? '' : '招募',
        subtitle: RecruitmentType[e.rtype].title,
        display: useRecruitmentDisplay(arr, e.rtype),
      })),
    ]),
  });
  return () => (
    <div class="d-flex flex-column h-100">
      <VToolbar>
        {mobile.value && <VBtn icon={mdiArrowLeft} onClick={p.onBack} />}
        <VToolbarTitle text="项目信息" />
        <VSpacer />
        {p.actions?.map((e) => <VBtn {...e} />)}
      </VToolbar>
      <div class="flex-grow-1 h-0 overflow-auto">
        {p.modelValue ? (
          <VScrollYReverseTransition group hideOnLeave>
            {state.panels.map((e, i) => (
              <FormSection v-model={state.isPass![i]} key={e.title} {...e} />
            ))}
          </VScrollYReverseTransition>
        ) : (
          <div class="center text-h2">{'请选择项目'}</div>
        )}
      </div>
    </div>
  );
});
