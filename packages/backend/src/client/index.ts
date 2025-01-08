import { createClient } from 'redis';
import { each, env } from 'shared';
import { log } from '~/util';
import { pg } from './db';

/**@see https://redis.io/docs/latest/develop/clients/nodejs/ */
export const redis = createClient({ url: env('REDIS_URL') });
redis.connect();

process.on('exit', () => {
  pg.end();
  redis.quit();
});
each({ pg, redis }, (client, k) => {
  client
    .on('connect', () => log.debug(void 0, `${k} connected`))
    .on('error', (err) => {
      log.error(err, `${k} error: ${err}`);
      process.exit(1);
    });
});

export * from './sms';
export * from './db';
