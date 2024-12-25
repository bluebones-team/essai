import { map } from 'shared';
import { tables } from 'shared/data';
import { z } from 'zod';

function zodToPostgresType(schema: z.ZodTypeAny): string {
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
    const elementType = zodToPostgresType(schema.element);
    return `${elementType}[]`;
  }
  if (schema instanceof z.ZodBranded || schema instanceof z.ZodOptional)
    return zodToPostgresType(schema.unwrap());
  if (schema instanceof z.ZodObject) return 'JSONB';
  console.error(`Unsupported Zod type: ${schema._def.typeName}`);
  return 'UNKNOWN';
}

const createTableSql = map(tables, ({ back }, tableName) => {
  const statements = map(
    back.shape as Record<string, z.ZodType>,
    (column, columnName) => {
      return `${columnName} ${zodToPostgresType(column)}`;
    },
  );
  return `CREATE TABLE IF NOT EXISTS "${tableName}" (\n    ${statements.join(', \n    ')}\n);`;
}).join('\n');

const totalSql = [createTableSql].join('\n\n');
// Bun.write('scripts/init.sql', totalSql);
