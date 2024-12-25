import { Pool } from 'pg';
import { createClient } from 'redis';
import { each, env } from 'shared';
export * from './sms';

const extension = {
  async create<T extends keyof BTables>(
    table: T,
    data: BTables[T],
  ): Promise<BTables[T]> {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const placeholders = keys.map((_, idx) => `$${idx + 1}`).join(', ');

    const query = `INSERT INTO "${table}" (${keys.join(', ')}) VALUES (${placeholders}) RETURNING *;`;
    const result = await db.query(query, values);
    return result.rows[0];
  },
  async read<T extends keyof BTables>(
    table: T,
    conditions: Partial<BTables[T]>,
  ): Promise<BTables[T][]> {
    const keys = Object.keys(conditions);
    const values = Object.values(conditions);
    const whereClause = keys
      .map((key, idx) => `${key} = $${idx + 1}`)
      .join(' AND ');

    const query = `SELECT * FROM "${table}"${keys.length ? ` WHERE ${whereClause}` : ''};`;
    const result = await db.query(query, values);
    return result.rows;
  },
  async update<T extends keyof BTables>(
    table: T,
    data: Partial<BTables[T]>,
    conditions: Partial<BTables[T]> = {},
  ) {
    const dataKeys = Object.keys(data);
    const dataValues = Object.values(data);
    const dataSetClause = dataKeys
      .map((key, idx) => `${key} = $${idx + 1}`)
      .join(', ');

    const conditionKeys = Object.keys(conditions);
    const conditionValues = Object.values(conditions);
    const whereClause = conditionKeys
      .map((key, idx) => `${key} = $${idx + dataKeys.length + 1}`)
      .join(' AND ');

    const query = `UPDATE "${table}" SET ${dataSetClause} WHERE ${whereClause} RETURNING *;`;
    const result = await db.query(query, [...dataValues, ...conditionValues]);
    return result.rows[0];
  },
  async delete<T extends keyof BTables>(
    table: T,
    conditions: Partial<BTables[T]> = {},
  ) {
    const keys = Object.keys(conditions);
    const values = Object.values(conditions);
    const whereClause = keys
      .map((key, idx) => `${key} = $${idx + 1}`)
      .join(' AND ');

    const query = `DELETE FROM "${table}" WHERE ${whereClause} RETURNING *;`;
    const result = await db.query(query, values);
    return result.rows[0];
  },
};

/**@see https://node-postgres.com/apis/pool */
export const db = Object.assign(
  new Pool({ connectionString: env('DB_URL') }).on('error', (err) =>
    console.error('Unexpected error on idle client', err),
  ),
  extension,
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
