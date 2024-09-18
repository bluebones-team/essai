import { errorFactory } from 'shared';
import { computed } from 'vue';
import type { Primitive } from 'zod';
import { snackbar } from './state';

export const error = errorFactory({
  cb(msg) {
    snackbar.show({ text: msg, type: 'error' });
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
