import { deepClone, deepIsEqual } from 'shared';
import {
  ExperimentState,
  RecruitmentType,
  Theme,
  type ExperimentFrontDataType,
} from 'shared/data';
import { progress } from 'shared/router';
import {
  computed,
  h,
  onMounted,
  onUnmounted,
  reactive,
  ref,
  shallowReactive,
  shallowRef,
  toRaw,
  toRef,
  watch,
  watchEffect,
  type Component,
  type Ref,
} from 'vue';
import { toAppTheme, type ActualTheme } from '~/ts/vuetify';
import { c } from './client';
import { setting, showProgressbar, snackbar } from './state';
import { error } from './util';

/**@see https://vueuse.org/guide/ */
export function useEventListener<T extends EventTarget, K extends EventType<T>>(
  target: T,
  type: K,
  listener: (e: EventValue<T, K>) => void,
) {
  onMounted(() => target.addEventListener(type, listener));
  onUnmounted(() => target.removeEventListener(type, listener));
}
export function useMatchMedia(query: string) {
  const mpl = window.matchMedia(query);
  const matches = ref(mpl.matches);
  useEventListener(mpl, 'change', (e) => (matches.value = e.matches));
  return matches;
}
export function useTheme() {
  const matches = useMatchMedia('(prefers-color-scheme: dark)');
  const actual = computed<ActualTheme>(() =>
    setting.display.theme === Theme.System.value
      ? matches.value
        ? Theme.Dark.value
        : Theme.Light.value
      : setting.display.theme,
  );
  return reactive({
    actual,
    app: computed(() => toAppTheme(setting.display.role, actual.value)),
  });
}
export function useComponent<T extends Component>(
  comp: T,
  defaults = () => ({}) as Props<T>,
) {
  const props = shallowRef<Props<T>>(defaults());
  return {
    Comp: (extraProps: Props<T>) => {
      const mergedProps = Object.assign({}, props.value, extraProps);
      return h(comp, mergedProps, mergedProps.slots);
    },
    change: (newProps?: Props<T>) =>
      (props.value = Object.assign(defaults(), newProps)),
  };
}
export function usePopup<
  T extends Component<{
    $props: {
      modelValue?: boolean;
      'onUpdate:modelValue'?: (v: boolean) => void;
    };
  }>,
>(comp: T, defaults = () => ({}) as Props<T>) {
  const { Comp, change } = useComponent(comp, defaults);
  const isShow = ref(false);
  return {
    Comp: () =>
      // @ts-ignore
      Comp({
        modelValue: isShow.value,
        'onUpdate:modelValue': (v) => (isShow.value = v),
      }),
    isShow,
    show(e?: Props<T>) {
      isShow.value = true;
      change(e);
    },
    close() {
      isShow.value = false;
    },
  };
}
export function useList<T>(items: T[]) {
  const _items = shallowReactive(items);
  return {
    items: _items,
    add(e: T) {
      _items.push(e);
    },
    remove(e: T) {
      _items.splice(_items.indexOf(e), 1);
    },
    clear() {
      _items.splice(0, _items.length);
    },
  };
}
export function useTempModel<T>(model: Ref<T>) {
  const clone = () => deepClone(toRaw(model.value));
  const temp = ref<T>() as Ref<T>;
  watchEffect(() => (temp.value = clone()));
  const hasChange = computed(() => !deepIsEqual(model.value, temp.value));
  return {
    model: temp,
    hasChange,
    save() {
      if (!hasChange.value) return;
      if (!temp.value) return error('temp model is null');
      model.value = deepClone(temp.value);
    },
    cancel() {
      if (!this.hasChange.value) return;
      temp.value = clone();
    },
  };
}
export function useDefaultProps<T extends LooseObject, D extends Partial<T>>(
  props: T,
  defaults: D,
) {
  return new Proxy(props as RequiredByKey<T, string & keyof D>, {
    get(o, k: string & keyof T) {
      if (props.hasOwnProperty(k)) return props[k] ?? defaults[k];
      // error(`prop ${k} is not declared`);
    },
  });
}
export function useTimer() {
  const time = ref(0);
  return {
    time,
    countdown(seconds: number) {
      time.value = seconds;
      const interval = setInterval(() => {
        if (--time.value <= 0) clearInterval(interval);
      }, 1e3);
      return () => clearInterval(interval);
    },
  };
}
export function useCombinedBoolean() {
  const states = reactive<boolean[]>([]);
  const combined = computed(() => states.every((s) => s));
  return { states, combined };
}

//data
export function useExperiment<T extends ExperimentFrontDataType>(type: T) {
  const state = shallowReactive({
    list: [] as FTables['experiment'][T]['preview'][],
    selected: void 0 as FTables['experiment'][T]['data'] | undefined,
    page: { ps: 20, pn: 1 },
  });

  watch(
    () => state.selected,
    (value) => {
      if (!value) return;
      c[`/exp/${type}/sup`].with(progress(showProgressbar, 'value')).send(
        { eid: value.eid },
        {
          //@ts-ignore
          0(res) {
            Object.assign(value, res.data);
          },
        },
      );
    },
  );
  function fetchList(
    filterData: FTables['experiment']['filter']['data'] = {
      rtype: RecruitmentType.Subject.value,
    },
  ) {
    return c[`/exp/${type}/ls`].with(progress(showProgressbar, 'value')).send(
      { ...state.page, filter: filterData },
      {
        //@ts-ignore
        0(res) {
          state.list = res.data;
        },
      },
    );
  }
  return {
    state,
    fetchList,
  };
}
export function useExperimentFilter<T extends ExperimentFrontDataType>(
  type: T,
) {
  const toDefaultRange = (): FTables['experiment']['filter']['range'] => ({
    duration_range: [1, 100] as [Shared['duration'], Shared['duration']],
    times_range: [1, 100],
    fee_range: [1, 100],
  });
  const state = reactive<FTables['experiment']['filter']>({
    range: toDefaultRange(),
    data: {
      rtype: RecruitmentType.Subject.value,
      state: ExperimentState.Ready.value,
      ...toDefaultRange(),
    },
  });
  function fetchRange() {
    if (type !== 'public')
      return snackbar.show({
        text: `not supported fetch ${type} range, only public`,
        color: 'error',
      });
    return c[`/exp/${'public'}/range`]
      .with(progress(showProgressbar, 'value'))
      .send(void 0, {
        0(res) {
          state.range = res.data;
          Object.assign(state.data, deepClone(res.data));
        },
      });
  }
  return {
    state,
    fetchRange,
  };
}
export function useRecruitment() {
  c['/recruit/ls'].send(
    {
      eid: '',
      pn: 1,
      ps: 1,
    },
    {
      0(res) {
        console.log(res.data);
      },
    },
  );
}
export function useRecruitmentCondition() {}
export function useRecruitmentParticipant(
  exp: Ref<FTables['experiment'][ExperimentFrontDataType]['data'] | undefined>,
) {
  const state = reactive({
    list: [] as FTables['recruitment_participant'][],
    rtype: RecruitmentType.Subject.value as RecruitmentType,
    selected: null as FTables['recruitment_participant'] | null,
    page: { ps: 20, pn: 1 },
  });
  watchEffect(() => {
    state.selected = state.list && null;
  });
  function fetchList() {
    if (!exp.value)
      return snackbar.show({ text: '请选择项目', color: 'error' });
    if (!state.selected)
      return snackbar.show({ text: '请选择招募条件', color: 'error' });
    return c['/recruit/ptc/ls'].with(progress(showProgressbar, 'value')).send(
      {
        ...state.page,
        rcid: state.selected.rcid,
      },
      {
        0(res) {
          state.list = res.data;
        },
      },
    );
  }
  return {
    state,
    fetchList,
  };
}
export function useExperimentData<T extends ExperimentFrontDataType>(type: T) {
  const exp = useExperiment(type);
  const filter = useExperimentFilter(type);
  const ptc = useRecruitmentParticipant(toRef(exp.state, 'selected'));
  return {
    exp: exp.state,
    fetchList: exp.fetchList,
    filter: filter.state,
    fetchRange: filter.fetchRange,
    search: () => exp.fetchList(filter.state.data),
    ptc: ptc.state,
    fetchPtcList: ptc.fetchList,
  };
}
export function useUserParticipant() {
  const state = reactive({
    list: [] as FTables['user_participant'][],
    selected: [] as FTables['user_participant'][],
    rtype: RecruitmentType.Subject.value as RecruitmentType,
    page: { ps: 20, pn: 1 },
  });
  function fetchList() {
    return c['/usr/ptc/ls'].with(progress(showProgressbar, 'value')).send(
      { ...state.page, filter: { rtype: state.rtype } },
      {
        0(res) {
          state.list = res.data;
        },
      },
    );
  }
  return {
    state,
    fetchList,
  };
}
