import { Pool } from 'pg';
import { createClient } from 'redis';
import { each, env } from 'shared';
export * from './sms';

type Sql = [creator: (idx?: number) => string, values: unknown[]];
export const sql = {
  empty: [() => '', []] satisfies Sql,
  merge(...sqls: Sql[]) {
    const { clause, values } = sqls.reduce(
      (acc, [creator, values]) => {
        const clause = creator(acc.idx);
        return {
          idx: acc.idx + values.length,
          clause:
            acc.clause && clause
              ? `${acc.clause} ${clause}`
              : acc.clause || clause,
          values: [...acc.values, ...values],
        };
      },
      { idx: 0, clause: '', values: [] as unknown[] },
    );
    return [clause, values] as const;
  },
  where(conditions: {}) {
    return [
      (idx = 0) => {
        const clause = Object.keys(conditions)
          .map((k, i) => `${k} = $${idx + i + 1}`)
          .join(' AND ');
        return clause && `WHERE ${clause}`;
      },
      Object.values(conditions),
    ] satisfies Sql;
  },
  page(page: { pn?: number; ps: number }) {
    const { pn = 1, ps } = page;
    return [
      (idx = 0) => `LIMIT $${idx + 1} OFFSET $${idx + 2}`,
      [ps, (pn - 1) * ps],
    ] satisfies Sql;
  },
  set(data: {}) {
    return [
      (idx = 0) => {
        const clause = Object.keys(data)
          .map((k, i) => `${k} = $${idx + i + 1}`)
          .join(', ');
        return clause && `SET ${clause}`;
      },
      Object.values(data),
    ] satisfies Sql;
  },
  values(datas: {}[]) {
    return [
      (idx = 0) => {
        if (datas.length === 0) return '';
        const keys = Object.keys(datas[0]);
        const len = keys.length;
        if (len === 0) return '';
        const clause = datas
          .map(
            (_, i) =>
              `(${keys.map((_, j) => `$${idx + j + 1 + len * i}`).join(', ')})`,
          )
          .join(', ');
        return clause && `(${keys.join(', ')}) VALUES ${clause}`;
      },
      datas.flatMap((e) => Object.values(e)),
    ] satisfies Sql;
  },
};
const db_extensions = {
  async create<T extends keyof BTables>(
    table: T,
    //@ts-ignore
    ...datas: PartialByKey<BTables[T], `${string}id`>[]
  ): Promise<BTables[T][]> {
    const [clause, values] = sql.merge(sql.values(datas));
    const query = `INSERT INTO "${table}" ${clause} RETURNING *;`;
    const result = await db.query(query, values);
    return result.rows;
  },
  async read<T extends keyof BTables>(
    table: T,
    conditions: Partial<BTables[T]>,
    page?: { pn?: number; ps: number },
  ): Promise<BTables[T][]> {
    const [clause, values] = sql.merge(
      sql.where(conditions),
      page ? sql.page(page) : sql.empty,
    );
    const query = `SELECT * FROM "${table}" ${clause};`;
    const result = await db.query(query, values);
    return result.rows;
  },
  async update<T extends keyof BTables>(
    table: T,
    conditions: Partial<BTables[T]>,
    data: Partial<BTables[T]>,
  ): Promise<BTables[T][]> {
    const [clause, values] = sql.merge(sql.set(data), sql.where(conditions));
    const query = `UPDATE "${table}" ${clause} RETURNING *;`;
    const result = await db.query(query, values);
    return result.rows;
  },
  async delete<T extends keyof BTables>(
    table: T,
    conditions: Partial<BTables[T]> = {},
  ): Promise<BTables[T][]> {
    const [clause, values] = sql.merge(sql.where(conditions));
    const query = `DELETE FROM "${table}" ${clause} RETURNING *;`;
    const result = await db.query(query, values);
    return result.rows;
  },
};

/**@see https://node-postgres.com/apis/pool */
export const db = Object.assign(
  new Pool({ connectionString: env('DB_URL') }).on('error', (err) =>
    console.error('Unexpected error on idle client', err),
  ),
  db_extensions,
);
/**@see https://redis.io/docs/latest/develop/clients/nodejs/ */
export const redis = createClient({ url: env('REDIS_URL') });
redis.connect();

process.on('exit', () => {
  db.end();
  redis.quit();
});
each({ db, redis }, (client, k) => {
  client
    .on('connect', () => console.log(`${k} connected.`))
    .on('error', (err) => {
      console.error(`${k} error: ${err}`);
      process.exit(1);
    });
});
