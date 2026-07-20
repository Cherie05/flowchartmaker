import { describe, expect, it } from 'vitest';
import { createKvRateLimiter } from './rateLimiter';

function createMockKv(): KVNamespace {
  const store = new Map<string, string>();
  return {
    async get(key: string) {
      return store.get(key) ?? null;
    },
    async put(key: string, value: string) {
      store.set(key, value);
    },
  } as unknown as KVNamespace;
}

describe('createKvRateLimiter', () => {
  it('allows attempts up to the daily limit and blocks the next one', async () => {
    const kv = createMockKv();
    const limiter = createKvRateLimiter(kv, 2, 0);
    const day = Date.parse('2026-07-20T00:00:00Z');

    await expect(limiter.begin('1.2.3.4', day)).resolves.toBeUndefined();
    await expect(limiter.begin('1.2.3.4', day + 1)).resolves.toBeUndefined();
    await expect(limiter.begin('1.2.3.4', day + 2)).rejects.toMatchObject({ code: 'RATE_LIMITED' });
  });

  it('enforces the cooldown between attempts', async () => {
    const kv = createMockKv();
    const limiter = createKvRateLimiter(kv, 10, 20);
    const now = Date.parse('2026-07-20T00:00:00Z');

    await limiter.begin('1.2.3.4', now);
    await expect(limiter.begin('1.2.3.4', now + 5_000)).rejects.toMatchObject({ code: 'RATE_LIMITED' });
    await expect(limiter.begin('1.2.3.4', now + 20_000)).resolves.toBeUndefined();
  });

  it('resets the count on a new UTC day', async () => {
    const kv = createMockKv();
    const limiter = createKvRateLimiter(kv, 1, 0);
    const day1 = Date.parse('2026-07-20T23:59:00Z');
    const day2 = Date.parse('2026-07-21T00:01:00Z');

    await limiter.begin('1.2.3.4', day1);
    await expect(limiter.begin('1.2.3.4', day2)).resolves.toBeUndefined();
  });

  it('tracks separate keys independently', async () => {
    const kv = createMockKv();
    const limiter = createKvRateLimiter(kv, 1, 0);
    const now = Date.parse('2026-07-20T00:00:00Z');

    await limiter.begin('1.1.1.1', now);
    await expect(limiter.begin('2.2.2.2', now)).resolves.toBeUndefined();
  });
});
