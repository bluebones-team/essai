import { expect, test, describe } from 'bun:test';
import { Client, Router } from '../router/rpc';

describe('Client', () => {
  test('Client', async () => {
    const client = new Client();
    const order = [];
    client.in
      .use(async (ctx, next) => {
        order.push(1);
        await next();
      })
      .mark('with')
      .use(async (ctx, next) => {
        order.push(2);
        await next();
      })
      .with(async (ctx, next) => {
        order.push(3);
        await next();
      })
      .with(async (ctx, next) => {
        order.push(4);
        await next();
      })
      .use((ctx, next) => {
        ctx.onData();
      });
    client.out
      .with(async (ctx, next) => {
        order.push(5);
        await next();
      })
      .use(async (ctx, next) => {
        order.push(6);
        await next();
      })
      .mark('with');
    await client.send();
    expect(order).toEqual([1, 3, 4, 2, 6, 5]);
    order.length = 0;
    await client.send();
    expect(order).toEqual([1, 2, 6]);
  });
});

describe('Router', () => {});
