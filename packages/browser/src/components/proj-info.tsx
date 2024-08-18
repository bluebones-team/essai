import { mdiArrowLeft } from '@mdi/js';
import { ProjectType, RecruitmentType } from 'shared/enum';
import { r } from 'shared/valid';
import { computed, defineComponent, inject, reactive, useModel } from 'vue';
import { useDisplay } from 'vuetify';
import { VBtn } from 'vuetify/components/VBtn';
import { VSpacer } from 'vuetify/components/VGrid';
import { VSelect } from 'vuetify/components/VSelect';
import { VTextField } from 'vuetify/components/VTextField';
import { VTextarea } from 'vuetify/components/VTextarea';
import { VToolbar, VToolbarTitle } from 'vuetify/components/VToolbar';
import { VScrollYReverseTransition } from 'vuetify/components/transitions';
import { Container, type ContainerDisplay } from '~/components/container';
import { DatePicker } from '~/components/date-picker';
import { Form } from '~/components/form';
import { Section } from '~/components/section';
import { useDefaults } from '~/ts/hook';
import { injectSymbol } from '~/ts/state';

const FormSection = defineComponent(function (
  p: {
    title: string;
    subtitle?: string;
    display: MaybeGetter<ContainerDisplay>;
  } & {
    modelValue?: boolean;
    'onUpdate:modelValue'?: (value: boolean) => void;
  },
) {
  const model = useModel(p, 'modelValue');
  return () => (
    <Section
      title={p.title}
      items={[
        {
          title: p.subtitle,
          comp: () => (
            <Form v-model={model.value}>
              <Container display={p.display} />
            </Form>
          ),
        },
      ]}
    ></Section>
  );
});
function useBaseDisplay(data: Project['Data']): ContainerDisplay {
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
            rules={r.str().min(5).max(20).name().c}
            counter
          />
        ),
      },
      {
        comp: () => (
          <VSelect
            v-model={data.type}
            label="类型"
            items={ProjectType._items.map((e) => ({
              title: e._name,
              subtitle: e.title,
              value: e._value,
            }))}
            itemProps
            rules={r.num().c}
            persistentHint
            hint={ProjectType[data.type].title}
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
          <VTextField v-model={data.position.detail} label="详细地址" />
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
            v-model={data.desc}
            label="项目介绍"
            maxlength={100}
            rows={3}
            rules={r.str().content().c}
            autoGrow
            counter
          />
        ),
      },
    ],
  ];
}
function useEventDisplay(events: Project['Data']['events']): ContainerDisplay {
  const editable = inject(injectSymbol.editable) ?? { value: false };
  const event = events[0];
  return [
    [
      {
        cols: 6,
        comp: () => (
          <DatePicker
            v-model={event[0]}
            label="开始日期"
            readonly={!editable.value}
          />
        ),
      },
      {
        comp: () => (
          <DatePicker
            v-model={event[1]}
            label="结束日期"
            readonly={!editable.value}
          />
        ),
      },
    ],
  ];
}
function useRecruitmentDisplay<T extends Project['Data']['recruitments']>(
  recruitments: T,
  type: RecruitmentType,
): ContainerDisplay {
  const data = recruitments.find((e) => e.rtype === type);
  if (!data) return [];
  const { mobile } = useDisplay();
  return [
    [
      {
        comp: () => (
          <VTextField
            v-model={data.contents[0]['total']}
            label="招募人数"
            type="number"
            rules={r.num().min(1).max(1e2).c}
          />
        ),
      },
      {
        cols: () => (mobile.value ? 6 : 4),
        comp: () => (
          <VTextField
            v-model={data.fee}
            label="报酬"
            type="number"
            rules={r.num().min(1).max(1e3).c}
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
    [...Array(data.durations.length).keys()].map((e, i) => ({
      comp: () => (
        <VTextField
          v-model={data.durations[i]}
          {...{
            label: `第${i + 1}次${i ? '' : ' (实验时长)'}`,
            // placeholder: '实验时长',
            type: 'number',
            rules: r.num().min(1).c,
            // hint: '单位: min',
            suffix: 'min',
          }}
        />
      ),
    })),
  ];
}

export const ProjectInfo = defineComponent(function (
  _p: {
    actions?: Props<VBtn>[];
    onBack?(): void;
    onSave?(data: Project['Data']): void;
    onPublish?(data: Project['Data']): void;
  } & {
    modelValue?: Project['Data'];
    'onUpdate:modelValue'?: (value: Project['Data']) => void;
  } & {
    isPasses?: boolean[];
    'onUpdate:isPasses'?: (value: boolean[]) => void;
  },
) {
  const { mobile } = useDisplay();
  const p = useDefaults(_p, {
    modelValue: () => ({}) as Project['Data'],
    isPasses: () => [],
  });
  const model = useModel(p, 'modelValue');
  const state = reactive({
    model,
    isPass: useModel(p, 'isPasses'),
    panels: computed(() => [
      { title: '基本', display: () => useBaseDisplay(model.value) },
      {
        title: '日程',
        display: () => useEventDisplay(model.value.events),
      },
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
              <FormSection v-model={state.isPass[i]} key={e.title} {...e} />
            ))}
          </VScrollYReverseTransition>
        ) : (
          <div class="center text-h2">{'请选择项目'}</div>
        )}
      </div>
    </div>
  );
});
