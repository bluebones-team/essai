import { shallowRef } from '@vue/reactivity';

export function signal<T extends NotFunction>(value: T): Signal<T> {
  const r = shallowRef(value);
  return Object.assign(() => r.value, {
    set(value: T) {
      r.value = value;
    },
    update(updater: (prev: T) => T) {
      r.value = updater(r.value);
    },
  });
}
