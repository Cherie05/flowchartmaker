import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config as loadDotEnv } from 'dotenv';

const DEFAULTS = {
  port: 8787,
  geminiModel: 'gemini-3.1-flash-lite',
  requestTimeoutMs: 30_000,
  dailyLimit: 3,
  cooldownSeconds: 20,
  maxPromptLength: 2_000,
  maxNodes: 25,
  maxEdges: 40,
} as const;

export interface ServerConfig {
  port: number;
  geminiApiKey: string | undefined;
  geminiModel: string;
  requestTimeoutMs: number;
  dailyLimit: number;
  cooldownSeconds: number;
  maxPromptLength: number;
  maxNodes: number;
  maxEdges: number;
}

export interface LoadedServerEnvironment {
  config: ServerConfig;
  environmentFilePath: string;
  environmentFileFound: boolean;
  projectRoot: string;
}

export class EnvironmentConfigError extends Error {
  constructor(public readonly variableName: string, message: string) {
    super(`${variableName}: ${message}`);
  }
}

export function resolveProjectRoot(startDirectory = path.dirname(fileURLToPath(import.meta.url))): string {
  let current = path.resolve(startDirectory);
  while (true) {
    if (existsSync(path.join(current, 'package.json')) && existsSync(path.join(current, 'server'))) {
      return current;
    }
    const parent = path.dirname(current);
    if (parent === current) {
      throw new EnvironmentConfigError('PROJECT_ROOT', 'could not locate the Wizzleflow repository root');
    }
    current = parent;
  }
}

export function loadServerEnvironment(options: {
  projectRoot?: string;
  environment?: NodeJS.ProcessEnv;
} = {}): LoadedServerEnvironment {
  const projectRoot = options.projectRoot ?? resolveProjectRoot();
  const environment = options.environment ?? process.env;
  const environmentFilePath = path.join(projectRoot, '.env');
  const environmentFileFound = existsSync(environmentFilePath);

  if (environmentFileFound) {
    const result = loadDotEnv({
      path: environmentFilePath,
      processEnv: environment,
      override: false,
      quiet: true,
    });
    if (result.error) {
      throw new EnvironmentConfigError('ENV_FILE', 'the root .env file could not be loaded');
    }
  }

  return {
    config: readServerConfig(environment),
    environmentFilePath,
    environmentFileFound,
    projectRoot,
  };
}

export function readServerConfig(environment: NodeJS.ProcessEnv = process.env): ServerConfig {
  const modelValue = environment.GEMINI_MODEL;
  const geminiModel = modelValue === undefined ? DEFAULTS.geminiModel : modelValue.trim();
  if (!geminiModel) {
    throw new EnvironmentConfigError('GEMINI_MODEL', 'must not be empty');
  }
  if (geminiModel.length > 200) {
    throw new EnvironmentConfigError('GEMINI_MODEL', 'must be 200 characters or fewer');
  }

  return {
    port: parsePositiveInteger('PORT', environment.PORT, DEFAULTS.port, 65_535),
    geminiApiKey: environment.GEMINI_API_KEY?.trim() || undefined,
    geminiModel,
    requestTimeoutMs: parsePositiveInteger(
      'AI_REQUEST_TIMEOUT_MS',
      environment.AI_REQUEST_TIMEOUT_MS,
      DEFAULTS.requestTimeoutMs,
      120_000,
    ),
    dailyLimit: parsePositiveInteger('AI_DAILY_LIMIT', environment.AI_DAILY_LIMIT, DEFAULTS.dailyLimit, 100),
    cooldownSeconds: parsePositiveInteger(
      'AI_COOLDOWN_SECONDS',
      environment.AI_COOLDOWN_SECONDS,
      DEFAULTS.cooldownSeconds,
      3_600,
    ),
    maxPromptLength: parsePositiveInteger(
      'AI_MAX_PROMPT_LENGTH',
      environment.AI_MAX_PROMPT_LENGTH,
      DEFAULTS.maxPromptLength,
      2_000,
    ),
    maxNodes: parsePositiveInteger('AI_MAX_NODES', environment.AI_MAX_NODES, DEFAULTS.maxNodes, 25),
    maxEdges: parsePositiveInteger('AI_MAX_EDGES', environment.AI_MAX_EDGES, DEFAULTS.maxEdges, 40),
  };
}

function parsePositiveInteger(name: string, raw: string | undefined, fallback: number, maximum: number): number {
  if (raw === undefined) return fallback;
  const normalized = raw.trim();
  if (!/^\d+$/.test(normalized)) {
    throw new EnvironmentConfigError(name, 'must be a positive whole number');
  }
  const value = Number.parseInt(normalized, 10);
  if (!Number.isSafeInteger(value) || value < 1 || value > maximum) {
    throw new EnvironmentConfigError(name, `must be between 1 and ${maximum}`);
  }
  return value;
}
