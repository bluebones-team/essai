import { zodSchema } from '@zodyac/zod-mongoose'; // https://github.com/git-zodyac/mongoose
import { Mongoose } from 'mongoose';
import { user } from 'shared/data';

const mongoose = new Mongoose();
mongoose.connection
  .on('connected', () => {
    console.log('MongoDB 连接成功');
  })
  .on('error', (err) => {
    console.error('MongoDB 连接错误:', err);
    mongoose.disconnect();
  })
  .on('disconnected', () => {
    console.log('MongoDB 连接断开');
  });

(async () => {
  const url = process.env.MONGO_URL || 'mongodb://localhost:27017/essai';
  await mongoose.connect(url);
  process.on('SIGINT', async () => {
    await mongoose.connection.close();
    console.log('MongoDB 连接已关闭');
    process.exit(0);
  });
})().catch((err) => {
  console.error('MongoDB 连接失败:', err);
  process.exit(0);
});

export const UserModel = mongoose.model('User', zodSchema(user.own));
