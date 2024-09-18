/**深层Partial */
type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends {} ? DeepPartial<T[K]> : T[K];
};
/**深层Omit */
type DeepOmit<T, U> = T extends U
  ? Omit<T, keyof U> & Record<keyof U, Omit<T[keyof U], keyof U[keyof U]>>
  : T;
/**把部分键设为Required */
type RequiredKeys<T, K extends keyof T> = Required<Pick<T, K>> & Omit<T, K>;
/**选取特定类型值的属性 */
type PickByValue<T, U> = {
  [K in keyof T]: T[K] extends U ? T[K] : never;
};
type BooleanKey<T, K extends keyof T = keyof T> = K extends any
  ? [T[K]] extends [boolean | undefined]
    ? K
    : never
  : never;

/**getter或value */
type MaybeGetter<T> = (() => T) | T;
type Diff<T extends {}, U extends {}> = T extends U
  ? { [K in keyof (T & U) as Exclude<K, keyof (T | U)>]: (T & U)[K] }
  : never;

//#region string
/**字符串分割 */
type Split<
  S extends string,
  D extends string = '',
  T extends string[] = [],
> = S extends `${infer L}${D}${infer R}` ? Split<R, D, [...T, L]> : [...T, S];
//#endregion string

//#region object
/**合并对象 */
type Merge<T, U> = {
  //@ts-ignore
  [K in keyof T | keyof U]: K extends keyof U ? U[K] : T[K];
};
/**合并对象元组 */
type MergeTuple<T extends any[], S = {}> = T extends []
  ? S
  : T extends [infer L, ...infer R]
    ? MergeTuple<R, Merge<S, L>>
    : never;
//#endregion object

//#region function
type Eq<T, U> =
  (<G>() => G extends T ? 1 : 2) extends <G>() => G extends U ? 1 : 2
    ? true
    : false;
type Not<T> = T extends true ? false : true;
type If<T, U, V = T> = Eq<T, true> extends true ? U : V;
type Branded<T, U> = T & { readonly __brand: U };
//#endregion function

//#region number
type IntToTuple<N extends number, T extends number[] = []> =
  Eq<T['length'], N> extends true ? T : IntToTuple<N, [...T, T['length']]>;
//#endregion number

//#region tuple
//#endregion tuple

//#region union
type UnionToIntersection<U> = (
  U extends unknown ? (k: U) => void : never
) extends (k: infer I) => void
  ? I
  : never;
/**获取联合类型最后一个值 */
type LastOfUnion<T> =
  UnionToIntersection<T extends any ? (e: T) => void : never> extends (
    e: infer R,
  ) => void
    ? R
    : never;
/**联合类型转元组 */
type UnionToTuple<T, S extends any[] = [], E = LastOfUnion<T>> = [T] extends [
  never,
]
  ? S
  : UnionToTuple<Exclude<T, E>, [E, ...S]>;
//#endregion union

//#region event
type EventType<T extends EventTarget> = keyof T extends infer K
  ? K extends `on${infer ET}`
    ? ET
    : never
  : never;
type EventValue<T extends EventTarget, K extends EventType<T>> = Parameters<
  T[`on${K}`]
>[0];
//#endregion event
