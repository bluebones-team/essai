import {
  Mongoose,
  Schema,
  type HydratedDocument,
  type Model,
  type SchemaTypeOptions,
} from 'mongoose';
import { mapValues } from 'shared';
import { date_ts, user } from 'shared/data';
import { z } from 'zod';
import { o } from '~/routes/util';

/**@see https://mongoosejs.com/docs/schematypes.html */
function _parseField<T extends z.ZodTypeAny>(
  v: T,
  k: string,
): SchemaTypeOptions<any> {
  if (v instanceof z.ZodObject) return parseObject(v);
  const defaults = {
    required: !v.isOptional(),
    unique: k.endsWith('id'),
  };
  if (v instanceof z.ZodBoolean) return { ...defaults, type: Boolean };
  if (v instanceof z.ZodString)
    return {
      ...defaults,
      type: v.isUUID ? Schema.Types.UUID : String,
      minLength: v.minLength ?? void 0,
      maxLength: v.maxLength ?? void 0,
    };
  if (v instanceof z.ZodNumber) {
    return {
      ...defaults,
      type: Number,
      min: v.minValue ?? void 0,
      max: v.maxValue ?? void 0,
      validate: v.isInt ? Number.isInteger : void 0,
    };
  }
  if (
    v instanceof z.ZodUnion &&
    Array.isArray(v.options) &&
    v.options.every(
      (o) => o instanceof z.ZodLiteral && typeof o.value === 'number',
    )
  )
    return {
      ...defaults,
      type: Number,
      enum: v.options.map((o: z.ZodLiteral<any>) => o.value),
    }; // enum
  if (v instanceof z.ZodTuple && Array.isArray(v.items))
    return {
      ...defaults,
      type: Array,
      validate: v.parse.bind(v),
    };
  if (v instanceof z.ZodArray)
    return {
      ...defaults,
      type: [parseField(v.element, `${k}[number]`)],
      validate: v.parse.bind(v),
    };
  throw new Error(`Unsupported zod type: ${v.constructor.name}`);
}
function parseField<T extends z.ZodTypeAny>(
  v: T,
  k: string,
): SchemaTypeOptions<any> {
  if (v instanceof z.ZodObject) return parseObject(v);
  return {};
}
/**@see https://github.com/git-zodyac/mongoose/blob/main/src/index.ts#L83 */
function parseObject<T extends z.ZodObject<{}>>(schema: T) {
  return mapValues(schema.shape, parseField);
}
function createModel<
  ZodSchema extends z.ZodObject<{}>,
  Methods extends Record<
    string,
    (this: HydratedDocument<Data>, ...e: any[]) => any
  >,
  Statics extends Record<
    string,
    <M extends {}>(this: Model<Data, {}, M>, ...e: any[]) => any
  >,
  Data = z.infer<ZodSchema>,
  DataModel = Model<Data, {}, Methods> & Statics,
>(
  name: string,
  schema: ZodSchema,
  options?: { methods?: Methods; statics?: Statics },
) {
  return db.model<Data, DataModel>(
    name,
    // @ts-ignore
    new Schema<Data, DataModel, Methods>(parseObject(schema), options),
  );
}

export const db = new Mongoose();
db.set('strictQuery', true);
export const model = {
  user: createModel('user', user.model, {
    methods: {
      toOwn(): User.Own {
        return Object.assign({}, o(this), { pwd: !!this.pwd });
      },
    },
    statics: {
      add(opts: Pick<User.Model, 'phone' | 'gender' | 'birthday' | 'pwd'>) {
        const uid = 1;
        const data: User.Model = {
          uid,
          name: `Bluebone No.${uid}`,
          face: `https://picsum.photos/1?uid=${uid}`,
          ...opts,
          emails: [],
          auth: {},
          created_time: date_ts(Date.now()),
        };
        return this.create(data);
      },
    },
  }),
};
