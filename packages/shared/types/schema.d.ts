import type { z } from 'zod';
import { report, shared, tables } from '../data/schema';

type Infer<T> = T extends z.ZodType
  ? z.infer<T>
  : T extends {}
    ? { [K in keyof T]: Infer<T[K]> }
    : 'T should be a ZodType or an object';
declare global {
  namespace ReportData {
    type Project = z.infer<typeof report.experiment>;
    type User = z.infer<typeof report.user>;
  }
  type Shared = Infer<typeof shared>;
  type Tables = Infer<typeof tables>;
  type FTables = { [K in keyof Tables]: Tables[K]['front'] };
  type BTables = { [K in keyof Tables]: Tables[K]['back'] };
}
