import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { resolveProjectRoot } from './env';

describe('development startup configuration', () => {
  const projectRoot = resolveProjectRoot();

  it('starts the frontend and server together and terminates them together', () => {
    const packageJson = JSON.parse(readFileSync(path.join(projectRoot, 'package.json'), 'utf8')) as {
      scripts: Record<string, string>;
    };
    expect(packageJson.scripts.dev).toContain('concurrently -k');
    expect(packageJson.scripts.dev).toContain('npm:dev:client');
    expect(packageJson.scripts.dev).toContain('npm:dev:server');
  });

  it('keeps Gemini and localhost URLs out of the frontend AI client', () => {
    const clientSource = readFileSync(
      path.join(projectRoot, 'src', 'features', 'ai', 'services', 'aiFlowchartClient.ts'),
      'utf8',
    );
    expect(clientSource).toContain("fetch('/api/health')");
    expect(clientSource).toContain("'/api/ai/generate-flowchart'");
    expect(clientSource).toContain("'/api/ai/edit-flowchart'");
    expect(clientSource).toContain("'/api/ai/review-flowchart'");
    expect(clientSource).toContain("'/api/ai/generate-test-cases'");
    expect(clientSource).not.toContain('@google/genai');
    expect(clientSource).not.toMatch(/https?:\/\//);
  });
});
