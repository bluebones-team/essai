import { Mongoose, Schema } from 'mongoose';
import { user } from 'shared/schema';
import type { z } from 'zod';

const mongoose = new Mongoose();
try {
  const url = process.env.MONGO_URL || 'mongodb://localhost:27017/essai';
  await mongoose.connect(url);
  mongoose.connection.on('connected', () => {
    console.log('MongoDB success');
  });
  mongoose.connection.on('error', () => {
    console.log('MongoDB error');
    mongoose.disconnect();
  });
} catch (e) {
  console.error('MongoDB error', e);
}
/**
 * @todo zod schema to mongoose schema
 * @link https://github.com/git-zodyac/mongoose
 */
function zodToMongoose<T extends z.ZodType>(schema: T) {
  console.error("zodToMongoose not implemented, can' use mongoose");
  return new Schema<z.infer<T>>();
}
export const UserModel = mongoose.model('User', zodToMongoose(user.own));
