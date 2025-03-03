import { date2ts, ts2date } from 'shared/data';
import { defineComponent } from 'vue';
import { VTextField } from 'vuetify/components/VTextField';
import { useModel } from '~/ts/hook';

export const DateInput = defineComponent(function (p: {
  modelValue?: Shared['timestamp'];
  'onUpdate:modelValue'?: (value: Shared['timestamp']) => void;
  rules: ((v: unknown) => Promise<true | string>)[];
}) {
  const model = useModel(p, 'modelValue', {
    get: () => '' + ts2date(p.modelValue),
    set: (v) => p['onUpdate:modelValue'](date2ts(v)),
  });
  return () => (
    <VTextField
      v-model={model.value}
      type="date"
      rules={p.rules.map((rule) => (v: any) => rule(date2ts(v)))}
    />
  );
});
