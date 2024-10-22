type LooseObject = Record<string, any>;
type ObjectIterator<T, R> = (v: T[keyof T], k: string, o: T) => R;

export function errorFactory<T extends boolean = true>(
  options: Partial<{
    console: boolean;
    debugger: boolean;
    throw: T;
    cb: (msg: string) => void;
  }> = {},
) {
  options = Object.assign(
    { console: true, debugger: true, throw: true },
    options,
  );
  // @ts-ignore
  return (msg: string, ...data: any[]): T extends true ? never : void => {
    if (options.debugger) debugger;
    if (options.console) console.error(msg, ...data);
    options.cb?.(msg);
    if (options.throw) throw msg;
  };
}
export const error = errorFactory();

//#region lodash
export function isObject(obj: unknown): obj is LooseObject {
  return typeof obj === 'object' && obj !== null;
}
export function isFunction(obj: unknown) {
  return typeof obj === 'function';
}
export function each<T extends LooseObject>(
  obj: T,
  fn: ObjectIterator<T, void>,
) {
  if (!isObject(obj)) return error('each only supports objects');
  Object.keys(obj).forEach((key) => {
    fn(obj[key], key, obj);
  });
}
export function map<T extends LooseObject, R>(
  obj: T,
  fn: ObjectIterator<T, R>,
) {
  if (!isObject(obj)) return error('map only supports objects');
  return Object.keys(obj).map((key) => fn(obj[key], key, obj));
}
/**@example mapValues({a: 1, b: 2, c: 3}, (v) => v * 2) // {a: 2, b: 4, c: 6} */
export function mapValues<T extends LooseObject, R>(
  obj: T,
  fn: ObjectIterator<T, R>,
) {
  if (!isObject(obj)) return error('mapValues only supports objects');
  const result: LooseObject = {};
  each(obj, (v, k, o) => {
    result[k] = fn(v, k, o);
  });
  return result as { [key in keyof T]: R };
}
/**@example pick({a: 1, b: 2, c: 3}, ['a', 'c']) // {a: 1, c: 3} */
export function pick<T extends LooseObject, K extends keyof T>(
  obj: T,
  keys: K[],
) {
  if (!isObject(obj)) return error('pick only supports objects');
  const result: Partial<T> = {};
  keys.forEach((key) => {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      result[key] = obj[key];
    }
  });
  return result as Pick<T, K>;
}
/**@example isEqualDeep({a: {b: 1}}, {a: {b: 1}}) // true */
export function isEqualDeep(
  a: unknown,
  b: unknown,
  cache: Set<unknown> = new Set(),
) {
  if (isFunction(a) || isFunction(b))
    return error('isEqualDeep does not support functions');
  if (cache.has(a) || cache.has(b))
    return error('isEqualDeep does not support circular references');
  if (isObject(a) && isObject(b)) {
    if (Object.is(a, b))
      return error('isEqualDeep does not support circular references');
    cache.add(a);
    cache.add(b);
    const aKeys = Object.keys(a);
    const bKeys = Object.keys(b);
    if (aKeys.length !== bKeys.length) return false;
    for (const key of aKeys) {
      if (!isEqualDeep(a[key], b[key], cache)) return false;
    }
    return true;
  }
  return Object.is(a, b);
}
export function cloneDeep<T>(e: T, cache: Set<unknown> = new Set()): T {
  if (isFunction(e)) return error('cloneDeep does not support functions');
  if (cache.has(e))
    return error('cloneDeep does not support circular references');
  if (isObject(e)) {
    cache.add(e);
    if (Array.isArray(e)) return e.map((v) => cloneDeep(v, cache)) as T;
    return mapValues(e, (v) => cloneDeep(v, cache));
  }
  return e;
}
/**@example flow((e) => e + 1, (e) => e * 2)(1) // 4 */
export function flow<T>(...fns: ((e: T) => T)[]) {
  return (e: T) => fns.reduce((acc, fn) => fn(acc), e);
}
/**@example uniqBy([{a: 1}, {a: 2}, {a: 1}, {a: 3}], 'a') // [{a: 1}, {a: 2}, {a: 3}] */
export function uniqBy<T extends LooseObject>(arr: T[], key: keyof T): T[];
/**@example uniqBy([{a: 1}, {a: 2}, {a: 1}, {a: 3}], (e) => e.a) // [{a: 1}, {a: 2}, {a: 3}] */
export function uniqBy<T extends LooseObject>(
  arr: T[],
  fn: (e: T) => unknown,
): T[];
export function uniqBy(arr: any[], by: any) {
  const _by = typeof by === 'string' ? (e: any) => e[by] : by;
  const seen = new Set();
  return arr.filter((e) => {
    const key = _by(e);
    return !seen.has(key) && seen.add(key);
  });
}
/**@example groupBy([{a: 1}, {a: 2}, {a: 1}, {a: 3}], 'a') // {1: [{a: 1}, {a: 1}], 2: [{a: 2}], 3: [{a: 3}]} */
export function groupBy<T extends LooseObject, K extends keyof T>(
  arr: T[],
  key: K,
): { [P in T[K]]: Extract<T, { [Q in K]: P }>[] };
/**@example groupBy([{a: 1}, {a: 2}, {a: 1}, {a: 3}], (e) => e.a) // {1: [{a: 1}, {a: 1}], 2: [{a: 2}], 3: [{a: 3}]} */
export function groupBy<T extends LooseObject, K extends PropertyKey>(
  arr: T[],
  fn: (e: T) => K,
): Record<K, T[]>;
export function groupBy(arr: any[], by: any) {
  const _by = typeof by === 'string' ? (e: any) => e[by] : by;
  const result: Record<any, any> = {};
  arr.forEach((e) => {
    const key = _by(e);
    (result[key] ??= []).push(e);
  });
  return result;
}
//#endregion lodash
