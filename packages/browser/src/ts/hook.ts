import { computed, reactive, ref, watch, type Ref } from '@vue/reactivity';
import { deepClone, deepEqual, omit, pick } from 'shared';
import {
  ExperimentState,
  RecruitmentType,
  Theme,
  type ExperimentFrontType,
} from 'shared/data';
import { type ApiRecordTypes } from 'shared/router';
import {
  h,
  onMounted,
  onUnmounted,
  shallowRef,
  useModel as vue_useModel,
  type Component,
} from 'vue';
import { toAppTheme, type ActualTheme } from '~/ts/vuetify';
import { useRequest } from './client';
import { setting } from './state';
import { error, getModelKeys } from './util';

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
  const isShow = shallowRef(false);
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
export function useModel<
  T extends LooseObject,
  K extends string & keyof T = 'modelValue',
>(
  props: T,
  key?: K,
  options?: Partial<{
    get: (v: T[K]) => any;
    set: (v: T[K]) => any;
  }>,
) {
  const keys = getModelKeys(key);
  for (const k of keys) {
    typeof props[k] === 'undefined' && error(`Missing required prop: ${k}`);
  }
  //@ts-ignore
  return vue_useModel(props, key ?? 'modelValue', options) as Ref<
    RequiredByKey<T, (typeof keys)[number]>[K]
  >;
}
/**
 * @see https://github.com/vueuse/vueuse/blob/main/packages/core/useCloned/index.ts#L42
 * @see https://github.com/vuetifyjs/vuetify/blob/master/packages/vuetify/src/components/VConfirmEdit/VConfirmEdit.tsx#L57
 */
export function useCloned<T>(source: Ref<T>) {
  const clone = () => deepClone(source.value);
  const cloned = ref() as Ref<T>;
  watch(source, () => (cloned.value = clone()), {
    immediate: true,
    deep: true,
  });
  const isModified = computed(() => !deepEqual(source.value, cloned.value));
  return {
    cloned,
    isModified,
    sync() {
      if (!isModified.value) return;
      source.value = cloned.value;
    },
    reset() {
      if (!isModified.value) return;
      cloned.value = clone();
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
export function useList<T, U extends boolean = false>(
  items: T[],
  multi = false as U,
) {
  const current = (multi ? [] : void 0) as U extends true ? T[] : T | undefined;
  return reactive({
    current,
    items,
    /**add item to list */
    add(item: T) {
      this.items.push(item);
    },
    /**remove item from list */
    remove(item: Partial<T>) {
      const keys = Object.keys(item);
      if (keys.length === 0) return;
      const index = this.items.findIndex((i) =>
        //@ts-ignore
        keys.every((k) => i[k] === item[k]),
      );
      if (index === -1) return;
      this.items.splice(index, 1);
    },
    set(items: T[]) {
      this.items.splice(0, this.items.length, ...items);
    },
  });
}
/**
 * @param path - api path
 * @param initReq - initial request data
 */
export function useFetchList<
  T extends Extract<keyof ApiRecordTypes, `${string}/ls`>,
  U extends boolean = false,
>(
  path: T,
  initReq: ApiRecordTypes[T]['in'] = { ps: 20, pn: 1 },
  multiple = false as U,
) {
  type Item = Extract<
    ApiRecordTypes[T]['out'],
    { data: unknown }
  >['data'][number];
  const list = useList<Item, U>([], multiple);
  const request = useRequest(path, initReq);
  watch(
    () => request.output,
    (v) => list.set(v),
  );
  return Object.assign(list, { request });
}

//data
export function useExperimentFilter<T extends ExperimentFrontType>(type: T) {
  const toDefaultRange = (): FTables['experiment']['filter']['range'] => ({
    duration_range: [1, 100] as [Shared['duration'], Shared['duration']],
    times_range: [1, 100],
    fee_range: [1, 100],
  });
  const request =
    type === 'public'
      ? useRequest('/exp/public/range', void 0, {
          0(res) {
            store.range = res.data;
            store.data = Object.assign(
              pick(store.data, ['rtype', 'state']),
              deepClone(res.data),
            );
          },
        })
      : console.warn(`not supported fetch ${type} experiment range`);
  const store = reactive({
    range: toDefaultRange(),
    data: {
      ...toDefaultRange(),
      rtype: RecruitmentType.Subject.value,
      state: ExperimentState.Ready.value,
    },
    request,
  });
  return store;
}
export function useExperimentList<T extends ExperimentFrontType>(type: T) {
  const filter = useExperimentFilter(type);
  const experimentList = useFetchList(`/exp/${type}/ls`, {
    ps: 20,
    pn: 1,
    ...filter.data,
  });
  watch(
    () => filter.data,
    () => {
      //@ts-ignore
      experimentList.request.input = Object.assign(
        omit(experimentList.request.input, Object.keys(filter.data)),
        filter.data,
      );
    },
  );
  return Object.assign(experimentList, { filter });
}
