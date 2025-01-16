import { Kysely, PostgresDialect } from 'kysely';
import { Pool } from 'pg';
import { createClient } from 'redis';
import { each, env } from 'shared';
export * from './sms';

/**@see https://node-postgres.com/apis/pool */
const pg = new Pool({ connectionString: env('DB_URL') }).on('error', (err) =>
  console.error('Unexpected error on idle client', err),
);
/**@see https://kysely.dev/docs/getting-started */
export const db = Object.assign(
  new Kysely<BTables>({ dialect: new PostgresDialect({ pool: pg }) }),
  {
    insert: <T extends keyof BTables>(
      table: T,
      //@ts-ignore
      ...datas: PartialByKey<BTables[T], `${string}id`>[]
    ) =>
      db
        .insertInto(table)
        //@ts-ignore
        .values(datas)
        .returningAll(),
    select: <T extends keyof BTables>(
      table: T,
      conditions: Partial<BTables[T]>,
      page = { pn: 1, ps: 30 },
    ) => {
      if (page.ps > 30) page.ps = 30;
      return (
        db
          .selectFrom(table)
          .selectAll()
          //@ts-ignore
          .where((eb) => eb.and(conditions))
          .limit(page.ps)
          .offset((page.pn - 1) * page.ps)
      );
    },
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
