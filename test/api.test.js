//@ts-check
import { describe, expect, it } from 'bun:test';
import { each } from 'shared';
import { OutputCode } from 'shared/data';
import { apiRecords, createClient, getApiURL } from 'shared/router';
import { zocker } from 'zocker';
import { routerMiddle } from '../packages/backend/src/router';
import { tokenMgr } from '../packages/backend/src/router/service';
import { o } from '../packages/backend/src/util';
import { c as client } from '../packages/browser/src/ts/client';

/**
 * @satisfies {{
 *   [K in keyof import('shared/router').ApiRecords]?:
 *     (client: ReturnType<typeof createClient>[K]) => void
 * }}
 */
const tests = {
  '/usr/phone/u'(c) {
    it('should update phone number successfully', () => {
      c.send(
        { old: '1234567890', new: '0987654321', code: '123456' },
        {
          0(res) {
            expect(res).toEqual(o.succ());
          },
          _(res) {
            throw new Error(`unexpected response: ${res}`);
          },
        },
      );
    });

    it('should fail if new phone number is already registered', async () => {
      c.send({ old: '1234567890', new: '0987654321', code: '123456' }, {});
    });

    it('should fail if OTP verification fails', async () => {});

    it('should fail if old phone number does not match', async () => {});

    it('should handle errors from db select', async () => {});

    it('should handle errors from db update', async () => {});
  },
};

const isDev = true;
const httpUrl = getApiURL(isDev);
const wsUrl = getApiURL(isDev, 'ws');
each(tests, (v, k) => {
  describe(k, () => {
    /**@type {import('shared/router').ApiRecord} */
    const api = apiRecords[k];
    if (api.meta.type === 'ws') {
      return;
    }

    it('should be allowed method', async () => {
      expect(
        await (
          await fetch(httpUrl + k, { method: '!' + api.meta.type })
        ).json(),
      ).toEqual(o.fail('method not allowed'));
    });

    it('should filter input data', async () => {
      const input = zocker(api.in).generate();
      const ctx = {
        path: k,
        input: Object.assign(input, {
          extra: Math.random(),
          __proto__: { evil: true },
        }),
      };
      await routerMiddle(ctx);
      expect(ctx.input).toEqual(input);
    });

    api.meta.token &&
      it('should verify token', async () => {
        expect(
          await (
            await fetch(httpUrl + k, {
              method: api.meta.type,
            })
          ).json(),
        ).toEqual(o(OutputCode.Unauthorizen.value));
        expect(
          await (
            await fetch(httpUrl + k, {
              method: api.meta.type,
              headers: { Authorization: 'invalid token' },
            })
          ).json(),
        ).toEqual(o(OutputCode.Unauthorizen.value));
        expect(
          await (
            await fetch(httpUrl + k, {
              method: api.meta.type,
              headers: {
                Authorization: tokenMgr.create({
                  uid: 0,
                  phone: '1234567890',
                }).access,
              },
            })
          ).json(),
        ).toEqual(o(OutputCode.NoUser.value));
      });

    v(client[k]);
  });
});
