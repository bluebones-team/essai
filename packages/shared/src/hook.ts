import type { z } from 'zod';
import { error, mapValues } from './util';

export function useValidator<T extends z.ZodRawShape>(schame: z.ZodObject<T>) {
  return mapValues(
    schame.shape,
    (field) =>
      [
        (value: unknown) => {
          const { success, error: err } = field.safeParse(value);
          if (!success) error('data format error', err.format()._errors);
          return success || err.format()._errors[0];
        },
      ] as const,
  );
}
