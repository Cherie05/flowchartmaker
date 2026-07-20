import { ApiError } from './errorHandler';

interface RateRecord {
  day: string;
  attempts: number;
  lastAttemptAt: number;
  active: boolean;
}

export interface RateLimiter {
  begin(key: string, now?: number): () => void;
}

export function createInMemoryRateLimiter(dailyLimit: number, cooldownSeconds: number): RateLimiter {
  const records = new Map<string, RateRecord>();
  const cooldownMs = cooldownSeconds * 1_000;

  return {
    begin(key, now = Date.now()) {
      const day = new Date(now).toISOString().slice(0, 10);
      const previous = records.get(key);
      const record = previous?.day === day
        ? previous
        : { day, attempts: 0, lastAttemptAt: 0, active: false };

      if (record.active) {
        throw new ApiError(429, 'RATE_LIMITED', 'A generation request is already in progress.');
      }
      if (record.attempts >= dailyLimit) {
        throw new ApiError(
          429,
          'RATE_LIMITED',
          'You have reached today’s free AI generation limit. Manual diagram editing is still available.',
        );
      }
      if (record.lastAttemptAt > 0 && now - record.lastAttemptAt < cooldownMs) {
        throw new ApiError(429, 'RATE_LIMITED', 'Please wait before generating another flowchart.');
      }

      record.attempts += 1;
      record.lastAttemptAt = now;
      record.active = true;
      records.set(key, record);

      return () => {
        record.active = false;
      };
    },
  };
}

