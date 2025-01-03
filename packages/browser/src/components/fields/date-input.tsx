import { date_ts, ts_date } from 'shared/data';
import { defineComponent, useModel } from 'vue';
import { VTextField } from 'vuetify/components/VTextField';
import { checkModel } from '~/ts/util';

export const DateInput = defineComponent(function (_p: {
  modelValue?: Shared['timestamp'];
  'onUpdate:modelValue'?: (value: Shared['timestamp']) => void;
  rules: ((v: unknown) => Promise<true | string>)[];
}) {
  const p = checkModel(_p);
  const model = useModel(p, 'modelValue', {
    get: () => '' + ts_date(p.modelValue),
    set: (v) => p['onUpdate:modelValue'](date_ts(v)),
  });
  return () => (
    <VTextField
      v-model={model.value}
      type="date"
      rules={p.rules.map((rule) => (v: any) => rule(date_ts(v)))}
    />
  );
});
