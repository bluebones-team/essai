import { Kysely, PostgresDialect, sql, type AliasedRawBuilder } from 'kysely';
import { Pool } from 'pg';
import { createClient } from 'redis';
import { each, env } from 'shared';
export * from './sms';
export * from './db';

/**@see https://node-postgres.com/apis/pool */
const pg = new Pool({ connectionString: env('DB_URL') }).on('error', (err) =>
  console.error('Unexpected error on idle client', err),
);
/**@see https://kysely.dev/docs/getting-started */
export const db = Object.assign(
  new Kysely<BTables>({ dialect: new PostgresDialect({ pool: pg }) }),
  {
    create: <T extends keyof BTables>(
      table: T,
      ...datas: Omit<
        BTables[T],
        //@ts-ignore
        {
          user: 'uid';
          experiment: 'eid';
          recruitment: 'rid';
          recruitment_condition: 'rcid';
        }[T]
      >[]
    ) =>
      db
        .insertInto(table)
        //@ts-ignore
        .values(datas),
    read: <T extends keyof BTables>(
      table: T,
      conditions: Partial<BTables[T]>,
    ) =>
      db
        .selectFrom(table)
        .selectAll()
        //@ts-ignore
        .where((eb) => eb.and(conditions)),
    update: <T extends keyof BTables>(
      table: T,
      conditions: Partial<BTables[T]>,
      data: Partial<BTables[T]>,
    ) =>
      db
        .updateTable(table)
        //@ts-ignore
        .set(data)
        //@ts-ignore
        .where((eb) => eb.and(conditions)),
    delete: <T extends keyof BTables>(
      table: T,
      conditions: Partial<BTables[T]>,
    ) =>
      db
        .deleteFrom(table)
        //@ts-ignore
        .where((eb) => eb.and(conditions)),
    /**@see https://kysely.dev/docs/recipes/extending-kysely#a-more-complex-example */
    values: <R extends LooseObject, A extends string>(
      records: R[],
      alias: A,
    ): AliasedRawBuilder<R, A> => {
      const keys = Object.keys(records[0]);
      const values = sql.join(
        records.map((r) => sql`(${sql.join(keys.map((k) => r[k]))})`),
      );
      const wrappedAlias = sql.ref(alias);
      const wrappedColumns = sql.join(keys.map(sql.ref));
      const aliasSql = sql`${wrappedAlias}(${wrappedColumns})`;
      return sql<R>`(values ${values})`.as<A>(aliasSql);
    },
  },
);
/**@see https://redis.io/docs/latest/develop/clients/nodejs/ */
export const redis = createClient({ url: env('REDIS_URL') });
redis.connect();

process.on('exit', () => {
  pg.end();
  redis.quit();
});
each({ pg, redis }, (client, k) => {
  client
    .on('connect', () => console.log(`${k} connected.`))
    .on('error', (err) => {
      console.error(`${k} error: ${err}`);
      process.exit(1);
    });
});
