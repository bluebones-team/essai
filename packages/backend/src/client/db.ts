import {
  createSelectQueryBuilder,
  Kysely,
  PostgresDialect,
  sql,
  type SelectQueryBuilder,
} from 'kysely';
import { Pool } from 'pg';
import { env } from 'shared';
import type { param } from 'shared/data';
import type { z } from 'zod';
import { log } from '~/util';

type FilterableTables = {
  [K in keyof FTables]: FTables[K] extends { filter: { data: infer D } }
    ? [table: K, data?: D]
    : never;
}[keyof FTables];
declare module 'kysely' {
  interface SelectQueryBuilder<DB, TB, O> {
    paginate(page: z.infer<typeof param.page>): SelectQueryBuilder<DB, TB, O>;
    filter<P extends FilterableTables>(...e: P): SelectQueryBuilder<DB, TB, O>;
  }
}
/**@HACK: add custom methods to SelectQueryBuilder
 * @ts-ignore */
Object.assign(createSelectQueryBuilder(null).constructor.prototype, {
  paginate(page) {
    page.ps = Math.min(page.ps, 100);
    return this.limit(page.ps).offset((page.pn - 1) * page.ps);
  },
  filter(table, data) {
    if (!data) return this;
    if (table === 'experiment') {
      let query = this.innerJoin(
        'recruitment',
        'experiment.eid',
        'recruitment.eid',
      );
      query = query.where('recruitment.rtype', '=', data.rtype);
      if (data.search) {
        query = query.where('experiment.title', 'like', data.search);
      }
      if (data.type) {
        query = query.where('experiment.type', '=', data.type);
      }
      if (data.state) {
        query = query.where('experiment.state', '=', data.state);
      }
      if (data.duration_range) {
        query = query.where((eb) =>
          eb.between(
            sql<number>`SELECR sum(v) FROM unnsert(${sql.ref('recruitment.durations')}) as v`,
            ...data.duration_range!,
          ),
        );
      }
      if (data.times_range) {
        query = query.where((eb) =>
          eb.between(
            eb.fn('array_length', ['recruitment.durations', eb.lit(1)]),
            ...data.times_range!,
          ),
        );
      }
      if (data.fee_range) {
        query = query.where((eb) =>
          eb.between('recruitment.fee', ...data.fee_range!),
        );
      }
      return query;
    }
    throw new Error(`not implemented for ${table}`);
  },
} as SelectQueryBuilder<BTables, keyof BTables, {}>);

/**@see https://node-postgres.com/apis/pool */
export const pg = new Pool({
  connectionString: env('DB_URL'),
}).on('error', (err) => log.error(err, `pg pool error: ${err}`));
/**@see https://kysely.dev/docs/getting-started */
export const db = new Kysely<BTables>({
  dialect: new PostgresDialect({ pool: pg }),
  log(event) {
    const logData = {
      ms: event.queryDurationMillis,
      sql: event.query.sql,
      params: event.query.parameters,
    };
    if (event.level === 'error') {
      log.error(
        { ...logData, error: event.error },
        `query error: ${logData.sql} - ${logData.params}`,
      );
    } else {
      log.debug(logData, `query ok: ${logData.sql} - ${logData.params}`);
    }
  },
});
