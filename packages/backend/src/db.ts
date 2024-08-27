import { Mongoose, Schema, type SchemaDefinition } from 'mongoose';
import { user } from 'shared/schema';
import { z } from 'zod';

const mongoose = new Mongoose();
mongoose.connection.on('connected', () => {
  console.log('MongoDB 连接成功');
});

mongoose.connection.on('error', (err) => {
  console.error('MongoDB 连接错误:', err);
  mongoose.disconnect();
});

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB 连接断开');
});

export async function connectToMongoDB() {
  try {
    const url = process.env.MONGO_URL || 'mongodb://localhost:27017/essai';
    await mongoose.connect(url);
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('MongoDB 连接已关闭');
      process.exit(0);
    });
  } catch (e) {
    console.error('MongoDB 连接失败:', e);
    process.exit(1);
  }
}

/**
 * @todo zod schema to mongoose schema
 * @link https://github.com/git-zodyac/mongoose
 */
function zodToMongoose<T extends z.ZodType>(zodSchema: T): Schema {
  const schemaDefinition: SchemaDefinition = {};

  if (zodSchema instanceof z.ZodObject) {
    Object.entries(zodSchema.shape).forEach(([key, value]) => {
      // @ts-ignore
      schemaDefinition[key] = zodTypeToMongooseType(value);
    });
  }

  return new Schema(schemaDefinition);
}

function zodTypeToMongooseType(zodType: z.ZodTypeAny): any {
  if (zodType instanceof z.ZodString) {
    return String;
  } else if (zodType instanceof z.ZodNumber) {
    return Number;
  } else if (zodType instanceof z.ZodBoolean) {
    return Boolean;
  } else if (zodType instanceof z.ZodDate) {
    return Date;
  } else if (zodType instanceof z.ZodArray) {
    return [zodTypeToMongooseType(zodType.element)];
  } else if (zodType instanceof z.ZodObject) {
    return zodToMongoose(zodType);
  } else if (zodType instanceof z.ZodEnum) {
    return { type: String, enum: zodType.options };
  } else if (zodType instanceof z.ZodUnion) {
    return Schema.Types.Mixed;
  }
  return Schema.Types.Mixed;
}


export const UserModel = mongoose.model('User', zodToMongoose(user.own));
