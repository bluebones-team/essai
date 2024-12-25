/// <reference path="schema.d.ts" />
/// <reference path="tool.d.ts" />

import type { Theme, Role } from '../data';

declare global {
  type LooseObject = Record<string, any>;
  type LocalStorage = Shared['token'] & { theme: Theme; role: Role };
}
