import {
  cloneDeep,
  isEqualDeep,
  isObject,
  mapValues,
  pick,
  uniqBy,
} from 'shared';
import { ProjectState, RecruitmentType, Theme } from 'shared/data';
import { progress } from 'shared/router';
import {
  computed,
  h,
  onMounted,
  onUnmounted,
  reactive,
  readonly,
  ref,
  shallowReactive,
  shallowRef,
  toRaw,
  toRef,
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
export function useComponent<T extends Component>(comp: T) {
  const props = shallowRef<Props<T>>();
  return {
    Comp: (p: Props<T>) => h(comp, Object.assign({}, props.value, p)),
    change: (p: Props<T>) => (props.value = p),
  };
}
export function usePopup<T extends Component<ModelProps<boolean>>>(
  comp: T,
  defaults = () => ({}) as Props<T>,
) {
  const { Comp, change } = useComponent(comp);
  const isShow = ref(false);
  return {
    Comp: () =>
      //@ts-ignore
      Comp({
        modelValue: isShow.value,
        'onUpdate:modelValue'(v: boolean) {
          isShow.value = v;
        },
      }),
    isShow,
    show(e?: Parameters<typeof change>[0]) {
      isShow.value = true;
      change(Object.assign(defaults(), e));
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
  const clone = () => cloneDeep(toRaw(model.value));
  const temp = ref<T>() as Ref<T>;
  watchEffect(() => (temp.value = clone()));
  const hasChange = computed(() => !isEqualDeep(model.value, temp.value));
  return {
    model: temp,
    hasChange,
    save() {
      if (!hasChange.value) return;
      if (!temp.value) return error('temp model is null');
      model.value = cloneDeep(temp.value);
    },
    cancel() {
      if (!this.hasChange.value) return;
      temp.value = clone();
    },
  };
}
export function useDefaults<T extends LooseObject, D extends Partial<T>>(
  props: T,
  defaults: D,
) {
  const toVal = (k: keyof T) => {
    const v = defaults[k];
    return isObject(v) ? readonly(v) : v;
  };
  return new Proxy(props as RequiredByKey<T, string & keyof D>, {
    get(o, k: string & keyof T) {
      if (props.hasOwnProperty(k)) return props[k] ?? toVal(k);
      error(`prop ${k} is not declared`);
    },
  });
}

//data
export function useProj<T extends 'public' | 'joined' | 'own'>(type: T) {
  const state = reactive({
    list: [] as Project[T]['Preview'][],
    preview: null as Project[T]['Preview'] | null,
    data: null as Project[T]['Data'] | null,
    page: { ps: 20, pn: 1 },
  });
  watchEffect(() => {
    if (!state.preview) return;
    c[`proj/${type}/sup`].use(progress(showProgressbar, 'value')).send(
      { pid: state.preview.pid },
      {
        //@ts-ignore
        0(res) {
          const data: NonNullable<typeof state.data> = Object.assign(
            res.data,
            state.preview,
          );
          data.recruitments = uniqBy(
            data.recruitments,
            (e) => e.rtype,
          ).toSorted((a, b) => a.rtype - b.rtype);
          state.data = data;
        },
      },
    );
  });
  function fetchList(
    filterData: Filter.Data = { rtype: RecruitmentType.Subject.value },
  ) {
    return c[`proj/${type}/list`].use(progress(showProgressbar, 'value')).send(
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
export function useFilter<T extends 'public' | 'joined' | 'own'>(type: T) {
  const toDefaultRange = () =>
    ({
      duration_range: [0, 100],
      times_range: [0, 100],
      fee_range: [0, 100],
    }) as Filter.Range;
  const state = reactive({
    range: toDefaultRange(),
    data: {
      rtype: RecruitmentType.Subject.value,
      state: ProjectState.Passed.value,
      ...toDefaultRange(),
    } as RequiredByKey<Filter.Data, 'state'>,
  });
  function fetchRange() {
    if (type !== 'public') {
      snackbar.show({
        text: `not supported fetch ${type} range, only public`,
        color: 'error',
      });
      return;
    }
    return c[`proj/${'public'}/range`]
      .use(progress(showProgressbar, 'value'))
      .send(void 0, {
        0(res) {
          //@ts-ignore
          state.range = mapValues(res.data, (v) => v.toSorted((a, b) => a - b));
          Object.assign(state.data, state.range);
        },
      });
  }
  return {
    state,
    fetchRange,
  };
}
export function usePtc(proj: Ref<Project['Preview'] | null>) {
  const state = reactive({
    list: [] as Participant.Join[],
    rtype: RecruitmentType.Subject.value as RecruitmentType,
    selected: null as Participant.Join | null,
    page: { ps: 20, pn: 1 },
  });
  watchEffect(() => {
    state.selected = state.list && null;
  });
  function fetchList() {
    if (!proj.value)
      return snackbar.show({ text: '请选择项目', color: 'error' });
    return c['ptc/list'].use(progress(showProgressbar, 'value')).send(
      {
        ...state.page,
        filter: { rtype: state.rtype },
        pid: proj.value.pid,
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
export function useProjData<T extends 'public' | 'joined' | 'own'>(type: T) {
  const proj = useProj(type);
  const filter = useFilter(type);
  const ptc = usePtc(toRef(proj.state, 'preview'));
  return {
    proj: proj.state,
    fetchProjList: proj.fetchList,
    filter: filter.state,
    fetchProjRange: filter.fetchRange,
    simpleSearch: () =>
      proj.fetchList(pick(filter.state.data, ['search', 'rtype'])),
    advancedSearch: () => proj.fetchList(filter.state.data),
    ptc: ptc.state,
    fetchPtcList: ptc.fetchList,
  };
}
export function useLib() {
  const state = reactive({
    list: [] as Participant.Lib[],
    selected: [] as Participant.Lib[],
    rtype: RecruitmentType.Subject.value as RecruitmentType,
    page: { ps: 20, pn: 1 },
  });
  function fetchList() {
    return c['lib/list'].use(progress(showProgressbar, 'value')).send(
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
