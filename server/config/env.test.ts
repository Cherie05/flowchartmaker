import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { EnvironmentConfigError, loadServerEnvironment, readServerConfig, resolveProjectRoot } from './env';

const temporaryDirectories: string[] = [];

afterEach(() => {
  while (temporaryDirectories.length > 0) {
    const directory = temporaryDirectories.pop();
    if (directory) rmSync(directory, { recursive: true, force: true });
  }
});

describe('server environment configuration', () => {
  it('locates the repository root independently of the current working directory', () => {
    expect(resolveProjectRoot(path.join(process.cwd(), 'server', 'config'))).toBe(process.cwd());
  });

  it('loads the single root .env and parses numeric values', () => {
    const projectRoot = createTemporaryRoot();
    writeFileSync(path.join(projectRoot, '.env'), [
      'GEMINI_API_KEY=test-only-secret',
      'GEMINI_MODEL=test-model',
      'AI_REQUEST_TIMEOUT_MS=45000',
      'AI_DAILY_LIMIT=4',
      'AI_COOLDOWN_SECONDS=25',
      'AI_MAX_PROMPT_LENGTH=1500',
      'AI_MAX_NODES=20',
      'AI_MAX_EDGES=30',
    ].join('\n'));

    const loaded = loadServerEnvironment({ projectRoot, environment: {} });
    expect(loaded.environmentFileFound).toBe(true);
    expect(loaded.config).toMatchObject({
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

  it('uses safe defaults and permits a missing key and missing .env file', () => {
    const projectRoot = createTemporaryRoot();
    const loaded = loadServerEnvironment({ projectRoot, environment: {} });
    expect(loaded.environmentFileFound).toBe(false);
    expect(loaded.config).toMatchObject({
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

  it.each([
    ['AI_REQUEST_TIMEOUT_MS', '0'],
    ['AI_DAILY_LIMIT', 'not-a-number'],
    ['AI_COOLDOWN_SECONDS', '-1'],
    ['AI_MAX_PROMPT_LENGTH', '2001'],
    ['AI_MAX_NODES', '26'],
    ['AI_MAX_EDGES', '41'],
  ])('fails safely for invalid %s', (name, value) => {
    expect(() => readServerConfig({ [name]: value })).toThrow(EnvironmentConfigError);
  });

  it('rejects an explicitly empty model name', () => {
    expect(() => readServerConfig({ GEMINI_MODEL: '   ' })).toThrow('GEMINI_MODEL');
  });
});

function createTemporaryRoot(): string {
  const directory = mkdtempSync(path.join(tmpdir(), 'wizzleflow-env-'));
  temporaryDirectories.push(directory);
  return directory;
}
