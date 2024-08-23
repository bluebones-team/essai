import { mdiMagnify, mdiTune } from '@mdi/js';
import { ProjectType, RecruitmentType } from 'shared/enum';
import { defineComponent, useModel } from 'vue';
import { useDisplay } from 'vuetify';
import { VIcon } from 'vuetify/components/VIcon';
import { VRangeSlider } from 'vuetify/components/VRangeSlider';
import { VSelect } from 'vuetify/components/VSelect';
import { VTextField } from 'vuetify/components/VTextField';
import { Container } from '~/components/container';
import { useDefaults } from '~/ts/hook';

const NumInp = defineComponent(
  (p: {
    modelValue?: number;
    'onUpdate:modelValue'?: (value: number) => void;
  }) => {
    const model = useModel(p, 'modelValue');
    return () => (
      <VTextField
        v-model={model.value}
        style="width: 4rem"
        variant="outlined"
        density="compact"
        type="number"
        hideDetails
        singleLine
      />
    );
  },
);
export const SimpleFilter = defineComponent(
  (
    p: { onSearch(): void; 'onShow:advanced'(): void } & {
      modelValue?: string;
      'onUpdate:modelValue'?: (value: string) => void;
    },
  ) => {
    const model = useModel(p, 'modelValue');
    return () => (
      <VTextField
        v-model={model.value}
        type="search"
        class="mx-4 w-100"
        variant="solo"
        placeholder="搜索项目"
        hideDetails
        onKeydown={(e: KeyboardEvent) => e.key === 'Enter' && p.onSearch()}
        v-slots={{
          'append-inner': () => [
            <VIcon
              class="mr-2"
              icon={mdiTune}
              onClick={p['onShow:advanced']}
            />,
            <VIcon icon={mdiMagnify} onClick={p.onSearch} />,
          ],
        }}
      ></VTextField>
    );
  },
);
export const AdvancedFilter = defineComponent(
  (
    p: { range: Filter.Range } & {
      modelValue?: RequiredKeys<Filter.Data, keyof Filter.Range>;
      'onUpdate:modelValue'?: (
        value: RequiredKeys<Filter.Data, keyof Filter.Range>,
      ) => void;
    },
  ) => {
    const model = useModel(
      useDefaults(p, {
        modelValue: () => ({
          rtype: RecruitmentType.Subject._value,
          ...p.range,
        }),
      }),
      'modelValue',
    );
    const { xs } = useDisplay();
    const display = [
      [
        {
          cols: 12,
          comp: () => (
            <VTextField
              v-model={model.value.search}
              label="搜索"
              clearable
              autofocus
            />
          ),
        },
        ...(
          [
            ['项目类型', 'type', ProjectType._items],
            ['招募类型', 'rtype', RecruitmentType._items],
          ] as const
        ).map(([label, key, items]) => ({
          cols: () => (xs.value ? 12 : 6),
          comp: () => (
            <VSelect
              v-model={model.value[key]}
              {...{
                label,
                items: items.map((e) => ({
                  title: e._name,
                  subtitle: e.title,
                  value: e._value,
                })),
              }}
              itemProps
              // multiple
              // chips
              clearable={key === 'type'}
            />
          ),
        })),
        ...(
          [
            ['项目报酬', 'fee_range', '单位: ￥'],
            ['参加次数', 'times_range', ''],
            ['平均时长', 'duration_range', '单位: min/次'],
          ] as const
        ).map(([label, key, hint]) => {
          return {
            cols: 12,
            comp: () => (
              <>
                <p class="pb-1 text-caption">{label}</p>
                <VRangeSlider
                  v-model={model.value[key]}
                  {...{
                    // label,
                    type: 'number',
                    step: 1,
                    showTicks: key === 'times_range',
                    min: p.range[key][0],
                    max: p.range[key][1],
                    hint,
                  }}
                  strict
                  thumbLabel
                  v-slots={{
                    prepend: () => <NumInp v-model={model.value[key][0]} />,
                    append: () => <NumInp v-model={model.value[key][1]} />,
                  }}
                ></VRangeSlider>
              </>
            ),
          };
        }),
      ],
    ];
    return () => <Container display={display} />;
  },
);
