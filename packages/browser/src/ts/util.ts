import { errorFactory, pick } from 'shared';

export const error = errorFactory({
  console: true,
  debugger: false,
  throw: true,
  async cb(msg) {
    const { snackbar } = await import('./state');
    snackbar.show({ text: msg, color: 'error' });
  },
});
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
