import type { inferRouterInputs, inferRouterOutputs } from '@trpc/server';
import type { Input, Output } from 'shared/router';
import { assertType, test } from 'vitest';
import type { ApiRouter } from '~/routes';

test('ApiRouter', () => {
  type _Input = inferRouterInputs<ApiRouter>;
  type _Output = inferRouterOutputs<ApiRouter>;
  assertType<Eq<_Input, Input>>(true);
  assertType<Eq<_Output, Output>>(true);
});
