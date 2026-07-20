import { describe, expect, it } from 'vitest';
import { readWorkerConfig, WorkerConfigError, type WorkerEnv } from './config';

function baseEnv(overrides: Partial<WorkerEnv> = {}): WorkerEnv {
  return { ASSETS: {} as Fetcher, ...overrides };
}

describe('readWorkerConfig', () => {
  it('uses safe defaults and permits a missing key', () => {
    const config = readWorkerConfig(baseEnv());
    expect(config).toMatchObject({
      geminiApiKey: undefined,
      geminiModel: 'gemini-3.1-flash-lite',
      requestTimeoutMs: 30_000,
      dailyLimit: 3,
      cooldownSeconds: 20,
      maxPromptLength: 2_000,
      maxNodes: 25,
      maxEdges: 40,
    });
  });

  it('parses configured values from the worker env bindings', () => {
    const config = readWorkerConfig(baseEnv({
      GEMINI_API_KEY: 'test-only-secret',
      GEMINI_MODEL: 'test-model',
      AI_REQUEST_TIMEOUT_MS: '45000',
      AI_DAILY_LIMIT: '4',
      AI_COOLDOWN_SECONDS: '25',
      AI_MAX_PROMPT_LENGTH: '1500',
      AI_MAX_NODES: '20',
      AI_MAX_EDGES: '30',
    }));
    expect(config).toMatchObject({
      geminiApiKey: 'test-only-secret',
      geminiModel: 'test-model',
      requestTimeoutMs: 45_000,
      dailyLimit: 4,
      cooldownSeconds: 25,
      maxPromptLength: 1_500,
      maxNodes: 20,
      maxEdges: 30,
    });
  });

  it.each([
    ['AI_REQUEST_TIMEOUT_MS', '0'],
    ['AI_DAILY_LIMIT', 'not-a-number'],
    ['AI_COOLDOWN_SECONDS', '-1'],
    ['AI_MAX_PROMPT_LENGTH', '2001'],
    ['AI_MAX_NODES', '26'],
    ['AI_MAX_EDGES', '41'],
  ])('fails safely for invalid %s', (name, value) => {
    expect(() => readWorkerConfig(baseEnv({ [name]: value } as Partial<WorkerEnv>))).toThrow(WorkerConfigError);
  });

  it('rejects an explicitly empty model name', () => {
    expect(() => readWorkerConfig(baseEnv({ GEMINI_MODEL: '   ' }))).toThrow('GEMINI_MODEL');
  });
});
