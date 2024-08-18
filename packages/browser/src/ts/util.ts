import { each, isObject } from 'lodash-es';
import { computed, h, type Component } from 'vue';
import { snackbar } from './state';

/**错误处理器 */
export function catcher<
  Abort extends boolean = false,
  Comp extends boolean = false,
>(
  msg: string,
  options: Partial<{
    data: any;
    console: boolean;
    snackbar: boolean;
    throw: Abort;
    comp: Comp;
  }> = {},
  //@ts-ignore
): Abort extends true ? never : Comp extends true ? Component : void {
  Object.assign(options, {
    data: null,
    console: true,
    snackbar: true,
    throw: false,
    comp: false,
  });
  if (options.console) {
    console.error(msg, options.data);
  }
  if (options.snackbar) {
    snackbar.show({ test: msg, color: 'error' });
  }
  if (options.throw) {
    throw msg;
  }
  if (options.comp) {
    //@ts-ignore
    return () => h('div', [msg, h('textarea', options.data)]);
  }
}
/**获取计算属性的结果 */
export function toComputed<T>(e: MaybeGetter<T>) {
  return computed(typeof e === 'function' ? (e as () => T) : () => e);
}
/**创建具有默认值的对象 */
export function createDefaultPropertyProxy<T>(
  getDefaultValue: () => T,
): Record<string, T> {
  return new Proxy(
    {},
    {
      get(obj: any, prop) {
        if (!obj.hasOwnProperty(prop)) {
          obj[prop] = getDefaultValue();
        }
        return obj[prop];
      },
    },
  );
}
/**对象深层diff */
export function diff<T extends Record<string, any>>(a: T, b: T) {
  if (a === b) {
    console.warn('diff: 参数指向同一对象');
    return;
  }
  const result: DeepPartial<T> = {};
  each(a, (value, key) => {
    if (isObject(a[key]) && isObject(b[key])) {
      if (a[key] === b[key]) {
        console.warn('diff: 部分属性值指向同一对象', key);
      }
      const _result = diff(a[key], b[key]);
      if (_result) {
        //@ts-ignore
        result[key] = _result;
      }
    } else if (a[key] !== b[key]) {
      //@ts-ignore
      result[key] = a[key];
    }
  });
  return Object.keys(result).length ? result : void 0;
}
/**限制表单输入数字长度 */
export function maxNumberLength<T>(data: T, key: keyof T, maxlength: number) {
  return {
    type: 'number',
    maxlength,
    counter: true,
    modelValue: data[key],
    'onUpdate:modelValue': (value: string) => {
      //@ts-ignore
      data[key] = +(value.length > maxlength
        ? value.slice(0, maxlength)
        : value);
    },
  };
}
/**生成等级序号数组 */
export function rank<T>(array: T[], compareFn: (a: T, b: T) => number) {
  const r = array.toSorted(compareFn);
  return array.map((item) => r.indexOf(item));
}
/**分组排序 */
export function groupSort<T, K>(
  items: T[],
  groupKey: (item: T) => number,
  sortKey: (item: T) => number,
): [groupKey: number, subitems: T[]][] {
  return Object.entries(Object.groupBy(items, groupKey))
    .toSorted((a, b) => +a[0] - +b[0])
    .map(([groupKey, subitems]) => [
      +groupKey,
      (subitems ?? []).toSorted((a, b) => sortKey(a) - sortKey(b)),
    ]);
}
