import { Mongoose, Schema } from 'mongoose';

const url = process.env.MONGO_URL || 'mongodb://localhost:27017/essai';
const mongoose = new Mongoose();
mongoose.connect(url);
mongoose.connection.on('connected', () => {
  console.log('MongoDB success');
});
mongoose.connection.on('error', () => {
  console.log('MongoDB error');
  mongoose.disconnect();
});

import type { z } from 'zod';
import { user } from 'shared/schema';

/**
 * @todo zod schema to mongoose schema
 * @link https://github.com/git-zodyac/mongoose
 */
function zodToMongoose<T extends z.ZodType>(schema: T) {
  console.error("zodToMongoose not implemented, can' use mongoose");
  return new Schema<z.infer<T>>();
}
export const UserModel = mongoose.model('User', zodToMongoose(user.own));
