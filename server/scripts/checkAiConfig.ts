import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { LoadedServerEnvironment } from '../config/env';
import { EnvironmentConfigError, loadServerEnvironment } from '../config/env';

export function formatAiConfigurationCheck(loaded: LoadedServerEnvironment): string[] {
  const lines = [
    `Environment file: ${loaded.environmentFileFound ? 'found' : 'not found'}`,
    `GEMINI_API_KEY configured: ${loaded.config.geminiApiKey ? 'yes' : 'no'}`,
  ];
  if (loaded.config.geminiApiKey) {
    lines.push(`Gemini model: ${loaded.config.geminiModel}`);
    lines.push('AI server configuration: valid');
  } else {
    lines.push('AI generation will be disabled');
    lines.push('AI server configuration: valid for manual editing');
  }
  return lines;
}

export function runAiConfigurationCheck(): number {
  try {
    for (const line of formatAiConfigurationCheck(loadServerEnvironment())) {
      process.stdout.write(`${line}\n`);
    }
    return 0;
  } catch (error) {
    const variable = error instanceof EnvironmentConfigError ? error.variableName : 'UNKNOWN';
    process.stderr.write(`AI server configuration: invalid (${variable})\n`);
    return 1;
  }
}

if (isMainModule(import.meta.url)) {
  process.exitCode = runAiConfigurationCheck();
}

function isMainModule(moduleUrl: string): boolean {
  return Boolean(process.argv[1]) && path.resolve(fileURLToPath(moduleUrl)) === path.resolve(process.argv[1]);
}

