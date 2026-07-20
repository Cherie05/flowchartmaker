import { describe, expect, it } from 'vitest';
import type { LoadedServerEnvironment } from '../config/env';
import { formatAiConfigurationCheck } from './checkAiConfig';

describe('AI configuration checker', () => {
  it('reports configured state without exposing the key', () => {
    const lines = formatAiConfigurationCheck(loadedEnvironment('test-secret-that-must-not-appear'));
    expect(lines).toContain('GEMINI_API_KEY configured: yes');
    expect(lines).toContain('Gemini model: gemini-3.1-flash-lite');
    expect(lines.join('\n')).not.toContain('test-secret-that-must-not-appear');
  });

  it('treats a missing key as a valid manual-editor configuration', () => {
    const lines = formatAiConfigurationCheck(loadedEnvironment(undefined));
    expect(lines).toContain('GEMINI_API_KEY configured: no');
    expect(lines).toContain('AI generation will be disabled');
  });
});

function loadedEnvironment(geminiApiKey: string | undefined): LoadedServerEnvironment {
  return {
    environmentFileFound: true,
    environmentFilePath: 'not-printed',
    projectRoot: 'not-printed',
    config: {
      port: 8787,
      geminiApiKey,
      geminiModel: 'gemini-3.1-flash-lite',
      requestTimeoutMs: 30_000,
      dailyLimit: 3,
      cooldownSeconds: 20,
      maxPromptLength: 2_000,
      maxNodes: 25,
      maxEdges: 40,
    },
  };
}

