import { computed, defineComponent, type VNode, type VNodeChild } from 'vue';
import { VForm } from 'vuetify/components/VForm';
import { VSelect } from 'vuetify/components/VSelect';
import { VSwitch } from 'vuetify/components/VSwitch';
import { VTextarea } from 'vuetify/components/VTextarea';
import { VTextField } from 'vuetify/components/VTextField';
import { z } from 'zod';
import { pickModel } from '~/ts/util';
import { Container, type ContainerLayout } from './container';
import { DateInput } from './fields/date-input';
import { NumberInput } from './fields/number-input';
import { RangeSlider } from './fields/range-slider';

export const Field = defineComponent(function <T extends z.ZodTypeAny>(p: {
  modelValue?: z.infer<T>;
  'onUpdate:modelValue'?: (value: z.infer<T>) => void;
  schema: T;
  label?: string;
  hint?: string;
  rules?: ((v: unknown) => Promise<true | string>)[];
  slots?: Record<string, () => VNodeChild>;
}) {
  const { schema } = p;
  const { metadata: _meta } = schema;
  const sharedProps = computed(() => ({
    modelValue: p.modelValue,
    'onUpdate:modelValue': p['onUpdate:modelValue'],
    label: p.label ?? _meta?.text,
    hint: p.hint ?? _meta?.desc,
    rules: p.rules ?? [
      async function (v: unknown) {
        const { success, error: err } = await schema.spa(v ?? void 0);
        return success || err.issues[0].message;
      },
    ],
  }));

  if (_meta?.type === 'textarea')
    return () => <VTextarea {...sharedProps.value} v-slots={p.slots} />;
  if (_meta?.type === 'date')
    return () => <DateInput {...sharedProps.value} v-slots={p.slots} />;
  if (_meta?.type === 'range')
    return () => <RangeSlider {...sharedProps.value} v-slots={p.slots} />;
  if (_meta?.items)
    return () => (
      <VSelect
        {...sharedProps.value}
        items={_meta?.items?.map((e) => ({
          title: e.text,
          subtitle: e.name,
          value: e.value,
        }))}
        itemProps
        v-slots={p.slots}
      />
    );
  if (schema instanceof z.ZodString)
    return () => <VTextField {...sharedProps.value} v-slots={p.slots} />;
  if (schema instanceof z.ZodNumber)
    return () => <NumberInput {...sharedProps.value} v-slots={p.slots} />;
  if (schema instanceof z.ZodBoolean)
    return () => <VSwitch {...sharedProps.value} v-slots={p.slots} />;
  if (schema instanceof z.ZodBranded || schema instanceof z.ZodOptional)
    return () => (
      <Field
        {...sharedProps.value}
        schema={schema.unwrap()}
        v-slots={p.slots}
      />
    );
  // console.log(schema);
  return () => (
    <VTextField
      {...sharedProps.value}
      errorMessages={`not supported field type: ${schema._def.typeName}`}
      v-slots={p.slots}
    />
  );
});
export const Form = defineComponent(function <T extends LooseObject>(p: {
  model: z.infer<z.ZodObject<T>>;
  schema: z.ZodObject<T>;
  layout: (comps: { [K in keyof T]: () => VNode }) => ContainerLayout;
  modelValue?: boolean | null;
  'onUpdate:modelValue'?: (value: boolean | null) => void;
}) {
  const comps = computed(
    () =>
      new Proxy(p.schema.shape, {
        get: (o, k: string) =>
          o[k] === void 0
            ? () => `${k} not found`
            : (attrs: {}) => (
                <Field v-model={p.model[k]} key={k} schema={o[k]} {...attrs} />
              ),
      }),
  );
  const layout = computed(() => p.layout(comps.value as any));
  return () => (
    <VForm {...pickModel(p)} validateOn="invalid-input lazy" fastFail>
      <Container layout={layout.value} />
    </VForm>
  );
});
