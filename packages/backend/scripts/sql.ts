import { map } from 'shared';
import { tables } from 'shared/data';
import { z } from 'zod';

function zod_postgresType(schema: z.ZodTypeAny): string {
  if (schema instanceof z.ZodString) {
    if (schema.isUUID) return 'UUID';
    return 'VARCHAR';
  }
  if (schema instanceof z.ZodNumber) {
    if (schema.isInt) return 'INT';
    return 'FLOAT';
  }
  if (schema instanceof z.ZodBoolean) return 'BOOLEAN';
  if (schema instanceof z.ZodUnion) {
    if (
      (schema.options as z.ZodType[]).every(
        (option) =>
          option instanceof z.ZodLiteral && Number.isInteger(option.value),
      )
    )
      return 'INT';
  }
  if (schema instanceof z.ZodArray) {
    const elementType = zod_postgresType(schema.element);
    return `${elementType}[]`;
  }
  if (schema instanceof z.ZodBranded || schema instanceof z.ZodOptional)
    return zod_postgresType(schema.unwrap());
  if (schema instanceof z.ZodObject) return 'JSONB';
  console.error(`Unsupported Zod type: ${schema._def.typeName}`);
  return 'UNKNOWN';
}

const createTableSql = map(tables, ({ back }, tableName) => {
  const statements = map(
    back.shape as Record<string, z.ZodType>,
    (column, columnName) => {
      return `${columnName} ${zod_postgresType(column)}`;
    },
  );
  return `CREATE TABLE IF NOT EXISTS "${tableName}" (\n    ${statements.join(', \n    ')}\n);`;
}).join('\n');

const totalSql = [
  createTableSql,
  `
ALTER TABLE "user" ADD UNIQUE (phone);
ALTER TABLE "user" ALTER COLUMN uid SET NOT NULL;
ALTER TABLE "user" ALTER COLUMN uid ADD GENERATED ALWAYS AS IDENTITY;
ALTER TABLE "user" ADD PRIMARY KEY (uid);
ALTER TABLE "user_participant" ADD PRIMARY KEY (uid, puid, rtype);
ALTER TABLE "user_participant" ADD FOREIGN KEY (uid) REFERENCES "user"(uid);
ALTER TABLE "user_participant" ADD FOREIGN KEY (puid) REFERENCES "user"(uid);
ALTER TABLE "experiment" ALTER COLUMN eid SET NOT NULL;
ALTER TABLE "experiment" ALTER COLUMN eid ADD GENERATED ALWAYS AS IDENTITY;
ALTER TABLE "experiment" ADD PRIMARY KEY (eid);
ALTER TABLE "experiment" ADD FOREIGN KEY (uid) REFERENCES "user"(uid);
ALTER TABLE "recruitment" ADD PRIMARY KEY (rid);
ALTER TABLE "recruitment" ADD FOREIGN KEY (eid) REFERENCES "experiment"(eid) ON DELETE CASCADE;
ALTER TABLE "recruitment_condition" ADD PRIMARY KEY (rcid);
ALTER TABLE "recruitment_condition" ADD FOREIGN KEY (rid) REFERENCES "recruitment"(rid) ON DELETE CASCADE;
ALTER TABLE "recruitment_participant" ADD PRIMARY KEY (uid, rcid);
ALTER TABLE "recruitment_participant" ADD FOREIGN KEY (uid) REFERENCES "user"(uid);
ALTER TABLE "recruitment_participant" ADD FOREIGN KEY (rcid) REFERENCES "recruitment_condition"(rcid) ON DELETE CASCADE;
ALTER TABLE "report" ADD FOREIGN KEY (uid) REFERENCES "user"(uid);
ALTER TABLE "message" ADD PRIMARY KEY (mid);
ALTER TABLE "message" ADD FOREIGN KEY (uid) REFERENCES "user"(uid);
ALTER TABLE "message" ADD FOREIGN KEY (suid) REFERENCES "user"(uid);
ALTER TABLE "feedback" ADD FOREIGN KEY (uid) REFERENCES "user"(uid);
`,
].join('\n\n');
Bun.write('temp/table.sql', totalSql);
