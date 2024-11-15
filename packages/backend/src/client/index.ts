import { createClient } from 'redis';
import { env, map } from 'shared';
import { db } from './db';

export const redis = createClient({
  url: env('REDIS_URL', 'redis://localhost:6379'),
});
export * from './db';
export * from './sms';

const connects = {
  mongodb: db.connect(env('MONGO_URL', 'mongodb://localhost:27017/essai')),
  redis: redis.connect(),
};
Promise.all(
  map(connects, (v, k) =>
    v.then(
      () => `${k} connected.`,
      (err) => `${k} connection error: ${err}`,
    ),
  ),
).then(console.log, (e) => {
  console.error(e);
  process.exit();
});
