/// <reference types="shared/types" />

import type { SelectQueryBuilder } from 'kysely';
import type { ConstructSignatureDeclaration } from 'typescript';

declare global {
  type SelectQueryBuilderAny = SelectQueryBuilder<BTables, keyof BTables, any>;
}
