import { createClient } from 'redis';

const redis = createClient({ url: process.env.REDIS_URL });
redis.on('ready', () => {
  console.log('Redis success');
});
redis.on('error', (error) => {
  console.error('Redis error', error);
  redis.disconnect();
});
redis.connect().catch(console.error);

export default redis;