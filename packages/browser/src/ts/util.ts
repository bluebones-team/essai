import { errorFactory, pick } from 'shared';
import { computed } from 'vue';
import type { Primitive } from 'zod';
import { snackbar } from './state';

export const error = errorFactory({
  console: true,
  debugger: false,
  throw: true,
  cb(msg) {
    snackbar.show({ text: msg, color: 'error' });
  },
});
export function toComputed<T extends Primitive>(e: MaybeGetter<T>) {
  return typeof e === 'function' ? computed(e) : { value: e };
}
export function createDefaultPropertyProxy<T>(getDefaultValue: () => T) {
  return new Proxy({} as Record<string | symbol, T>, {
    get(o, p) {
      if (!o.hasOwnProperty(p)) {
        o[p] = getDefaultValue();
      }
      return o[p];
    },
  });
}
function getModelKeys<T extends string = 'modelValue'>(key?: T) {
  key = key ?? ('modelValue' as T);
  const keys = [key, `onUpdate:${key}`] as const;
  return keys as NonReadonly<typeof keys>;
}
export function checkModel<
  T extends LooseObject,
  K extends string & keyof T = 'modelValue',
>(props: T, key?: K) {
  const keys = getModelKeys(key);
  for (const k of keys) {
    typeof props[k] === 'undefined' && error(`Missing required prop: ${k}`);
  }
  return props as RequiredByKey<T, (typeof keys)[number]>;
}
export function pickModel<
  T extends LooseObject,
  K extends string & keyof T = 'modelValue',
>(props: T, key?: K) {
  const keys = getModelKeys(key);
  return pick(props, keys) as Pick<T, (typeof keys)[number]>;
}
