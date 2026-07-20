import type { AddressInfo } from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { apiErrorResponseSchema, generateFlowchartResponseSchema } from '../../shared/ai/apiSchemas';
import { createApp } from '../app';
import { EnvironmentConfigError, loadServerEnvironment } from '../config/env';

const SMOKE_PROMPT = 'Create a simple employee leave approval workflow with approval and rejection outcomes.';

export async function runAiSmokeTest(): Promise<number> {
  if (process.env.CI) {
    process.stdout.write('Gemini smoke test skipped: real provider requests are disabled in CI.\n');
    return 0;
  }

  let loaded;
  try {
    loaded = loadServerEnvironment();
  } catch (error) {
    const variable = error instanceof EnvironmentConfigError ? error.variableName : 'UNKNOWN';
    process.stderr.write(`Gemini smoke test failed: invalid server configuration (${variable}).\n`);
    return 1;
  }

  if (!loaded.config.geminiApiKey) {
    process.stdout.write('Gemini smoke test skipped: GEMINI_API_KEY is not configured.\n');
    return 0;
  }

  const server = createApp({ config: loaded.config }).listen(0, '127.0.0.1');
  try {
    await new Promise<void>((resolve, reject) => {
      server.once('listening', resolve);
      server.once('error', reject);
    });
    const address = server.address() as AddressInfo;
    const response = await fetch(`http://127.0.0.1:${address.port}/api/ai/generate-flowchart`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: SMOKE_PROMPT }),
    });
    const body: unknown = await response.json().catch(() => null);
    if (!response.ok) {
      const parsedError = apiErrorResponseSchema.safeParse(body);
      process.stderr.write(`Gemini request: FAIL (${parsedError.success ? parsedError.data.error.code : 'UNEXPECTED_RESPONSE'})\n`);
      return 1;
    }
    const parsed = generateFlowchartResponseSchema.safeParse(body);
    if (!parsed.success) {
      process.stderr.write('Gemini request: FAIL (INVALID_AI_RESPONSE)\n');
      return 1;
    }
    process.stdout.write('Gemini request: PASS\n');
    process.stdout.write(`Model: ${loaded.config.geminiModel}\n`);
    process.stdout.write('Diagram validation: PASS\n');
    process.stdout.write(`Nodes: ${parsed.data.diagram.nodes.length}\n`);
    process.stdout.write(`Edges: ${parsed.data.diagram.edges.length}\n`);
    return 0;
  } catch {
    process.stderr.write('Gemini request: FAIL (SERVER_OR_NETWORK_ERROR)\n');
    return 1;
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
}

if (isMainModule(import.meta.url)) {
  process.exitCode = await runAiSmokeTest();
}

function isMainModule(moduleUrl: string): boolean {
  return Boolean(process.argv[1]) && path.resolve(fileURLToPath(moduleUrl)) === path.resolve(process.argv[1]);
}

