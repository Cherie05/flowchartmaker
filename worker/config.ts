const DEFAULTS = {
  geminiModel: 'gemini-3.1-flash-lite',
  requestTimeoutMs: 30_000,
  dailyLimit: 3,
  cooldownSeconds: 20,
  maxPromptLength: 2_000,
  maxNodes: 25,
  maxEdges: 40,
} as const;

export interface WorkerEnv {
  GEMINI_API_KEY?: string;
  GEMINI_MODEL?: string;
  AI_REQUEST_TIMEOUT_MS?: string;
  AI_DAILY_LIMIT?: string;
  AI_COOLDOWN_SECONDS?: string;
  AI_MAX_PROMPT_LENGTH?: string;
  AI_MAX_NODES?: string;
  AI_MAX_EDGES?: string;
  RATE_LIMIT_KV?: KVNamespace;
  ASSETS: Fetcher;
}

export interface WorkerConfig {
  geminiApiKey: string | undefined;
  geminiModel: string;
  requestTimeoutMs: number;
  dailyLimit: number;
  cooldownSeconds: number;
  maxPromptLength: number;
  maxNodes: number;
  maxEdges: number;
}

export class WorkerConfigError extends Error {
  constructor(public readonly variableName: string, message: string) {
    super(`${variableName}: ${message}`);
  }
}

export function readWorkerConfig(env: WorkerEnv): WorkerConfig {
  const modelValue = env.GEMINI_MODEL;
  const geminiModel = modelValue === undefined ? DEFAULTS.geminiModel : modelValue.trim();
  if (!geminiModel) {
    throw new WorkerConfigError('GEMINI_MODEL', 'must not be empty');
  }
  if (geminiModel.length > 200) {
    throw new WorkerConfigError('GEMINI_MODEL', 'must be 200 characters or fewer');
  }

  return {
    geminiApiKey: env.GEMINI_API_KEY?.trim() || undefined,
    geminiModel,
    requestTimeoutMs: parsePositiveInteger('AI_REQUEST_TIMEOUT_MS', env.AI_REQUEST_TIMEOUT_MS, DEFAULTS.requestTimeoutMs, 120_000),
    dailyLimit: parsePositiveInteger('AI_DAILY_LIMIT', env.AI_DAILY_LIMIT, DEFAULTS.dailyLimit, 100),
    cooldownSeconds: parsePositiveInteger('AI_COOLDOWN_SECONDS', env.AI_COOLDOWN_SECONDS, DEFAULTS.cooldownSeconds, 3_600),
    maxPromptLength: parsePositiveInteger('AI_MAX_PROMPT_LENGTH', env.AI_MAX_PROMPT_LENGTH, DEFAULTS.maxPromptLength, 2_000),
    maxNodes: parsePositiveInteger('AI_MAX_NODES', env.AI_MAX_NODES, DEFAULTS.maxNodes, 25),
    maxEdges: parsePositiveInteger('AI_MAX_EDGES', env.AI_MAX_EDGES, DEFAULTS.maxEdges, 40),
  };
}

function parsePositiveInteger(name: string, raw: string | undefined, fallback: number, maximum: number): number {
  if (raw === undefined) return fallback;
  const normalized = raw.trim();
  if (!/^\d+$/.test(normalized)) {
    throw new WorkerConfigError(name, 'must be a positive whole number');
  }
  const value = Number.parseInt(normalized, 10);
  if (!Number.isSafeInteger(value) || value < 1 || value > maximum) {
    throw new WorkerConfigError(name, `must be between 1 and ${maximum}`);
  }
  return value;
}
