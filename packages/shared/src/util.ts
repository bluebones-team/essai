import type { z } from 'zod';

type ObjectIterator<T, R> = (v: T[keyof T], k: string, o: T) => R;

export function errorFactory<T extends boolean = true>(opts: {
  console: boolean;
  debugger: boolean;
  throw: T;
  cb?(msg: string): void;
}) {
  // @ts-ignore
  return (msg: string, ...data: any[]): T extends true ? never : void => {
    if (opts.debugger) debugger;
    if (opts.console) {
      console.error(msg, ...data);
      // console.trace();
    }
    opts.cb?.(msg);
    if (opts.throw) throw new Error(msg);
  };
}
export const error = errorFactory({
  console: true,
  debugger: false,
  throw: true,
});

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
/**@example omit({a: 1, b: 2, c: 3}, ['a', 'c']) // {b: 2} */
export function omit<T extends LooseObject, K extends keyof T>(
  obj: T,
  keys: K[],
) {
  if (!isObject(obj)) return error('omit only supports objects');
  const result: Partial<T> = { ...obj };
  keys.forEach((key) => {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      delete result[key];
    }
  });
  return result as Omit<T, K>;
}
/**@example isEqualDeep({a: {b: 1}}, {a: {b: 1}}) // true */
export function deepIsEqual(
  a: unknown,
  b: unknown,
  cache: Set<unknown> = new Set(),
) {
  if (isFunction(a) || isFunction(b))
    return error('deepIsEqual does not support functions');
  if (cache.has(a) || cache.has(b))
    return error('deepIsEqual does not support circular references');
  if (isObject(a) && isObject(b)) {
    if (Object.is(a, b))
      return error('deepIsEqual does not support circular references');
    cache.add(a);
    cache.add(b);
    const aKeys = Object.keys(a);
    const bKeys = Object.keys(b);
    if (aKeys.length !== bKeys.length) return false;
    for (const key of aKeys) {
      if (!deepIsEqual(a[key], b[key], cache)) return false;
    }
    return true;
  }
  return Object.is(a, b);
}
export function deepClone<T>(e: T, cache: Set<unknown> = new Set()): T {
  if (isFunction(e)) return error('deepClone does not support functions');
  if (cache.has(e))
    return error('deepClone does not support circular references');
  if (isObject(e)) {
    cache.add(e);
    if (Array.isArray(e)) return e.map((v) => deepClone(v, cache)) as T;
    return mapValues(e, (v) => deepClone(v, cache));
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
/**@example difference([1, 2, 3], [2, 3, 4]) // [1] */
export function difference<
  const A extends unknown[],
  const B extends unknown[],
>(a: A, b: B) {
  const setB = new Set(b);
  return a.filter((e) => !setB.has(e)) as UnionToTuple<
    Exclude<A[number], B[number]>
  >;
}
/**@example intersection([1, 2, 3], [2, 3, 4]) // [2, 3] */
export function intersection<
  const A extends unknown[],
  const B extends unknown[],
>(a: A, b: B) {
  const setB = new Set(b);
  return a.filter((e) => setB.has(e)) as UnionToTuple<
    Extract<A[number], B[number]>
  >;
}
//#endregion lodash
//#region onion
export type Middle<T extends {}> = (
  ctx: T,
  next: () => MaybePromise<any>,
) => MaybePromise<any>;
export type ComposedMiddle<T extends {}> = (
  ctx: T,
  next?: () => MaybePromise<any>,
  start?: string | number,
) => MaybePromise<any>;
export class Onion<T extends {}, K extends string = string> {
  middles;
  readonly markers = new Proxy({} as { [P in K]: number }, {
    get(o, k: K) {
      const v = o[k];
      if (typeof v !== 'number') throw new Error(`marker not found: ${k}`);
      return v;
    },
  });
  constructor(middles: Middle<T>[] = []) {
    this.middles = [...middles];
  }
  /**add middle for onion */
  use(middle: Middle<T>) {
    this.middles.push(middle);
    return this;
  }
  /**add marker for onion */
  mark(name: K) {
    this.markers[name] = this.middles.length;
    return this;
  }
  findIndex(id: K | string) {
    const index =
      this.markers[id as K] ?? this.middles.findIndex((e) => e.name === id);
    if (index === -1) error(`Middle not found: ${id}`);
    return index;
  }
  /**@see https://github.com/koajs/compose/blob/master/index.js */
  compose(): ComposedMiddle<T> {
    return (ctx, next, start = 0) => {
      const dispatch = (index: number) => {
        if (index === this.middles.length) return next?.();
        const middle = this.middles[index];
        try {
          // console.log(`dispatch middle: ${middle.name}`, ctx.path);
          return middle(ctx, () => dispatch(index + 1));
        } catch (err) {
          console.error(`middle error: ${middle.name}`, err);
        }
      };
      return dispatch(
        typeof start === 'number' ? start : this.findIndex(start),
      );
    };
  }
}
//#region other
export function env<K extends keyof NodeJS.ProcessEnv>(
  key: K,
  defaultValue?: NodeJS.ProcessEnv[K],
) {
  const value = process.env[key] ?? defaultValue;
  if (value === void 0) throw `Environment variable not found: ${key}`;
  return value;
}
export function toRule(schame: z.ZodType) {
  return async function (v: unknown) {
    const { success, error: err } = await schame.spa(v);
    // success || error('field validation failed', err.format()._errors);
    return success || err.format()._errors.join('\n');
  };
}
export function toFieldRules<T extends z.ZodRawShape>(schame: z.ZodObject<T>) {
  return mapValues(schame.shape, (v) => [toRule(v)] as const);
}
