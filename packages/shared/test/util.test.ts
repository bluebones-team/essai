import { expect, test, describe } from 'vitest';
import {
  each,
  map,
  mapValues,
  pick,
  deepIsEqual,
  deepClone,
  flow,
  uniqBy,
  groupBy,
} from '../src/util';

describe('each', () => {
  test('should iterate over an object', () => {
    const obj = { a: 1, b: 2, c: 3 };
    const result: number[] = [];
    each(obj, (v) => result.push(v));
    expect(result).toEqual([1, 2, 3]);
  });

  test('should handle an empty object', () => {
    const result: unknown[] = [];
    each({}, (v) => result.push(v));
    expect(result).toEqual([]);
  });

  test('should handle non-object types', () => {
    const nonObjects = [null, undefined, 123, 'string'];
    nonObjects.forEach((v) => {
      expect(() => each(v as any, (v) => v)).toThrow();
    });
  });
});

describe('map', () => {
  test('should correctly map values of an object', () => {
    const input = { a: 1, b: 2, c: 3 };
    const result = map(input, (v) => v * 2);
    expect(result).toEqual([2, 4, 6]);
  });

  test('should handle an empty object', () => {
    const input = {};
    const result = map(input, (v) => v * 2);
    expect(result).toEqual([]);
  });

  test('should correctly map values with a complex function', () => {
    const input = { a: 1, b: 2, c: 3 };
    const result = map(input, (v, i) => `${i}: ${v}`);
    expect(result).toEqual(['a: 1', 'b: 2', 'c: 3']);
  });

  test('should handle non-numeric values', () => {
    const input = { a: 'hello', b: true, c: null };
    const result = map(input, (v) => typeof v);
    expect(result).toEqual(['string', 'boolean', 'object']);
  });

  test('should handle non-object types', () => {
    const nonObjects = [null, undefined, 123, 'string'];
    nonObjects.forEach((v) => {
      expect(() => map(v as any, (v) => v)).toThrow();
    });
  });
});

describe('mapValues', () => {
  test('should correctly map values of an object', () => {
    const input = { a: 1, b: 2, c: 3 };
    const result = mapValues(input, (v) => v * 2);
    expect(result).toEqual({ a: 2, b: 4, c: 6 });
  });

  test('should handle an empty object', () => {
    const input = {};
    const result = mapValues(input, (v) => v * 2);
    expect(result).toEqual({});
  });

  test('should correctly map values with a complex function', () => {
    const input = { a: 1, b: 2, c: 3 };
    const result = mapValues(input, (v, k) => `${k}: ${v}`);
    expect(result).toEqual({ a: 'a: 1', b: 'b: 2', c: 'c: 3' });
  });

  test('should handle non-numeric values', () => {
    const input = { a: 'hello', b: true, c: null };
    const result = mapValues(input, (v) => typeof v);
    expect(result).toEqual({ a: 'string', b: 'boolean', c: 'object' });
  });

  test('should handle non-object types', () => {
    const nonObjects = [null, undefined, 123, 'string'];
    nonObjects.forEach((v) => {
      expect(() => mapValues(v as any, (v) => v)).toThrow();
    });
  });
});

describe('pick', () => {
  test('should pick the specified keys from an object', () => {
    const input = { a: 1, b: 2, c: 3 };
    const result = pick(input, ['a', 'c']);
    expect(result).toEqual({ a: 1, c: 3 });
  });

  test('should handle an empty object', () => {
    const input: any = {};
    const result = pick(input, ['a', 'c']);
    expect(result).toEqual({});
  });

  test('should handle non-existent keys', () => {
    const input: any = { a: 1, b: 2, c: 3 };
    const result = pick(input, ['a', 'd']);
    expect(result).toEqual({ a: 1 });
  });

  test('should handle non-object types', () => {
    const nonObjects = [null, undefined, 123, 'string'];
    nonObjects.forEach((v) => {
      expect(() => pick(v as any, ['a', 'c'])).toThrow();
    });
  });
});

describe('isEqualDeep', () => {
  test('should compare two objects deeply', () => {
    const obj1 = { a: 1, b: { c: 2, d: [3, 4] } };
    const obj2 = { a: 1, b: { c: 2, d: [3, 4] } };
    const obj3 = { a: 1, b: { c: 2, d: [3, 5] } };
    const obj4 = { a: 1, b: { c: 2, d: [3, 4, 5] } };
    const obj5 = { a: 1, b: { c: 2, d: [3, 4] }, e: 5 };
    const obj6 = { a: 1, b: { c: 2, d: [3, 4] }, e: { f: 6 } };
    const obj7 = { a: 1, b: { c: 2, d: [3, 4] }, e: { f: 6, g: 7 } };
    const obj8 = { a: 1, b: { c: 2, d: [3, 4] }, e: { f: 6, g: 7 } };
    const obj9 = { a: 1, b: { c: 2, d: [3, 4] }, e: { f: 6, g: 8 } };

    expect(deepIsEqual(obj1, obj2)).toBe(true);
    expect(deepIsEqual(obj1, obj3)).toBe(false);
    expect(deepIsEqual(obj1, obj4)).toBe(false);
    expect(deepIsEqual(obj1, obj5)).toBe(false);
    expect(deepIsEqual(obj5, obj6)).toBe(false);
    expect(deepIsEqual(obj6, obj7)).toBe(false);
    expect(deepIsEqual(obj7, obj8)).toBe(true);
    expect(deepIsEqual(obj7, obj9)).toBe(false);
  });

  test('should handle circular references', () => {
    const obj1: any = { a: 1, b: { c: 2, d: [3, 4] } };
    const obj2: any = { a: 1, b: { c: 2, d: [3, 4] } };
    obj1.b.e = obj1;
    obj2.b.e = obj2;
    expect(() => deepIsEqual(obj1, obj2)).toThrow();
  });

  test('should handle non-iterable types', () => {
    const nonIterables = [null, undefined, 123, 'string'];
    nonIterables.forEach((v) => {
      expect(deepIsEqual(v, v)).toBe(true);
      expect(deepIsEqual(v, {})).toBe(false);
      expect(deepIsEqual({}, v)).toBe(false);
    });
  });
});

describe('cloneDeep', () => {
  test('should clone an object deeply', () => {
    const obj1 = { a: 1, b: { c: 2, d: [3, 4] } };
    const obj2 = deepClone(obj1);
    obj2.b.d.push(5);
    expect(deepIsEqual(obj1, obj2)).toBe(false);
  });

  test('should handle circular references', () => {
    const obj1: any = { a: 1, b: { c: 2, d: [3, 4] } };
    obj1.b.e = obj1;
    expect(() => deepClone(obj1)).toThrow();
  });

  test('should handle non-iterable types', () => {
    const nonIterables = [null, undefined, 123, 'string'];
    nonIterables.forEach((v) => {
      expect(deepIsEqual(deepClone(v), v)).toBe(true);
    });
  });
});

describe('flow', () => {
  test('should apply functions in order', () => {
    const add1 = (x: number) => x + 1;
    const add2 = (x: number) => x + 2;
    const add3 = (x: number) => x + 3;
    const result = flow(add1, add2, add3)(0);
    expect(result).toBe(6);
  });

  test('should handle an empty array', () => {
    const result = flow()(0);
    expect(result).toBe(0);
  });

  test('should handle non-function types', () => {
    const nonFunctions = [null, undefined, 123, 'string'];
    nonFunctions.forEach((v) => {
      expect(() => flow(v as any)(0)).toThrow();
    });
  });
});

describe('uniqBy', () => {
  test('should remove duplicates by a key', () => {
    const arr = [
      { id: 1, name: 'John' },
      { id: 2, name: 'Jane' },
      { id: 1, name: 'Bob' },
      { id: 3, name: 'Alice' },
      { id: 2, name: 'Alice' },
    ];
    const result = uniqBy(arr, 'id');
    expect(result).toEqual([
      { id: 1, name: 'John' },
      { id: 2, name: 'Jane' },
      { id: 3, name: 'Alice' },
    ]);
  });

  test('should handle an empty array', () => {
    const result = uniqBy([], 'id');
    expect(result).toEqual([]);
  });

  test('should handle non-array types', () => {
    const nonArrays = [null, undefined, 123, 'string'];
    nonArrays.forEach((v) => {
      expect(() => uniqBy(v as any, 'id')).toThrow();
    });
  });
});

describe('groupBy', () => {
  test('should group an array by a key', () => {
    const arr = [
      { id: 1, name: 'John' },
      { id: 2, name: 'Jane' },
      { id: 1, name: 'Bob' },
      { id: 3, name: 'Alice' },
      { id: 2, name: 'Alice' },
    ];
    const result = groupBy(arr, 'id');
    expect(result).toEqual({
      1: [
        { id: 1, name: 'John' },
        { id: 1, name: 'Bob' },
      ],
      2: [
        { id: 2, name: 'Jane' },
        { id: 2, name: 'Alice' },
      ],
      3: [{ id: 3, name: 'Alice' }],
    });
  });

  test('should handle an empty array', () => {
    const result = groupBy([], 'id');
    expect(result).toEqual({});
  });

  test('should handle non-array types', () => {
    const nonArrays = [null, undefined, 123, 'string'];
    nonArrays.forEach((v) => {
      expect(() => groupBy(v as any, 'id')).toThrow();
    });
  });
});
