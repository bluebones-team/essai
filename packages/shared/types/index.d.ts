/// <reference path="schema.d.ts" />
/// <reference path="tool.d.ts" />

import type { Primitive as _Primitive } from 'zod';
import type { Role, Theme } from '../data';

declare global {
  type LooseObject = Record<string, any>;
  type LocalStorage = Shared['token'] & { theme: Theme; role: Role };
  type Primative = _Primitive;
}
