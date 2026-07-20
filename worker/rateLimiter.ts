import { ApiError } from '../server/middleware/errorHandler';

interface RateRecord {
  day: string;
  attempts: number;
  lastAttemptAt: number;
}

export interface WorkerRateLimiter {
  begin(key: string, now?: number): Promise<void>;
}

const RECORD_TTL_SECONDS = 26 * 60 * 60;

/**
 * KV has no atomic read-modify-write, so two requests racing in the same
 * instant can both read the same count and both succeed. Acceptable for a
 * prototype abuse deterrent (matches the documented limits of the original
 * in-memory limiter, which also wasn't authoritative across instances) but
 * not a hard guarantee. The in-flight concurrency lock from the in-memory
 * version is dropped here since it can't be implemented correctly without
 * compare-and-swap.
 */
export function createKvRateLimiter(kv: KVNamespace, dailyLimit: number, cooldownSeconds: number): WorkerRateLimiter {
  const cooldownMs = cooldownSeconds * 1_000;

  return {
    async begin(key, now = Date.now()) {
      const day = new Date(now).toISOString().slice(0, 10);
      const storageKey = `ratelimit:${key}`;
      const raw = await kv.get(storageKey);
      const previous = raw ? (JSON.parse(raw) as RateRecord) : null;
      const record: RateRecord = previous && previous.day === day ? previous : { day, attempts: 0, lastAttemptAt: 0 };

      if (record.attempts >= dailyLimit) {
        throw new ApiError(429, 'RATE_LIMITED', "You have reached today's free AI generation limit. Manual diagram editing is still available.");
      }
      if (record.lastAttemptAt > 0 && now - record.lastAttemptAt < cooldownMs) {
        throw new ApiError(429, 'RATE_LIMITED', 'Please wait before generating another flowchart.');
      }

      record.attempts += 1;
      record.lastAttemptAt = now;
      await kv.put(storageKey, JSON.stringify(record), { expirationTtl: RECORD_TTL_SECONDS });
    },
  };
}
