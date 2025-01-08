import { describe, expect, it } from 'bun:test';
import { sql } from '../src/client';

describe('sql', () => {
  describe('merge', () => {
    it('should merge multiple SQL clauses and values correctly', () => {
      const sql1 = sql.where({ name: 'John', age: 30 });
      const sql2 = sql.page({ pn: 2, ps: 10 });
      const [clause, values] = sql.merge(sql1, sql2);

      expect(clause).toBe('WHERE name = $1 AND age = $2 LIMIT $3 OFFSET $4');
      expect(values).toEqual(['John', 30, 10, 10]);
    });

    it('should handle empty SQL clauses', () => {
      const [clause, values] = sql.merge();
      expect(clause).toBe('');
      expect(values).toEqual([]);
    });
  });

  describe('where', () => {
    it('should generate WHERE clause with conditions', () => {
      const [clause, values] = sql.where({ name: 'Alice', age: 25 });
      expect(clause(0)).toBe('WHERE name = $1 AND age = $2');
      expect(values).toEqual(['Alice', 25]);
    });

    it('should handle empty conditions', () => {
      const [clause, values] = sql.where({});
      expect(clause(0)).toBe('');
      expect(values).toEqual([]);
    });
  });

  describe('page', () => {
    it('should generate LIMIT and OFFSET clause with default values', () => {
      const [clause, values] = sql.page({ ps: 20 });
      expect(clause(0)).toBe('LIMIT $1 OFFSET $2');
      expect(values).toEqual([20, 0]);
    });

    it('should generate LIMIT and OFFSET clause with custom values', () => {
      const [clause, values] = sql.page({ pn: 3, ps: 50 });
      expect(clause(0)).toBe('LIMIT $1 OFFSET $2');
      expect(values).toEqual([50, 100]);
    });
  });

  describe('set', () => {
    it('should generate SET clause with data', () => {
      const [clause, values] = sql.set({ name: 'Bob', age: 40 });
      expect(clause(0)).toBe('SET name = $1, age = $2');
      expect(values).toEqual(['Bob', 40]);
    });

    it('should handle empty data', () => {
      const [clause, values] = sql.set({});
      expect(clause(0)).toBe('');
      expect(values).toEqual([]);
    });
  });

  describe('values', () => {
    it('should generate VALUES clause with multiple data entries', () => {
      const [clause, values] = sql.values([
        { name: 'Charlie', age: 35 },
        { name: 'Dave', age: 45 },
      ]);
      expect(clause(0)).toBe('(name, age) VALUES ($1, $2), ($3, $4)');
      expect(values).toEqual(['Charlie', 35, 'Dave', 45]);
    });

    it('should handle empty data array', () => {
      const [clause, values] = sql.values([]);
      expect(clause(0)).toBe('');
      expect(values).toEqual([]);
    });

    it('should handle empty object in data array', () => {
      const [clause, values] = sql.values([{}]);
      expect(clause(0)).toBe('');
      expect(values).toEqual([]);
    });
  });
});
