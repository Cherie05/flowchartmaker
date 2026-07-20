import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { WorkerEnv } from './config';

const { createInteraction, createClient } = vi.hoisted(() => ({
  createInteraction: vi.fn(),
  createClient: vi.fn(),
}));
vi.mock('@google/genai', () => ({
  GoogleGenAI: class {
    constructor(options: unknown) {
      createClient(options);
    }
    interactions = { create: createInteraction };
  },
}));

import app from './index';

const validDiagram = {
  schemaVersion: '1.0',
  title: 'Simple workflow',
  summary: 'A simple process.',
  assumptions: [],
  nodes: [
    { key: 'start', kind: 'start', label: 'Start', description: '' },
    { key: 'end', kind: 'end', label: 'End', description: '' },
  ],
  edges: [{ key: 'edge', from: 'start', to: 'end', label: '' }],
};

function createMockKv(): KVNamespace {
  const store = new Map<string, string>();
  return {
    async get(key: string) {
      return store.get(key) ?? null;
    },
    async put(key: string, value: string) {
      store.set(key, value);
    },
  } as unknown as KVNamespace;
}

function createEnv(overrides: Partial<WorkerEnv> = {}): WorkerEnv {
  return {
    ASSETS: { fetch: vi.fn().mockResolvedValue(new Response('<html>spa</html>', { status: 200 })) } as unknown as Fetcher,
    RATE_LIMIT_KV: createMockKv(),
    ...overrides,
  };
}

beforeEach(() => {
  createInteraction.mockReset();
  createClient.mockReset();
});

describe('worker fetch handler', () => {
  it('reports AI unconfigured when no key is present', async () => {
    const res = await app.request('/api/health', {}, createEnv());
    expect(await res.json()).toEqual({ status: 'ok', ai: { configured: false } });
  });

  it('reports AI configured with provider and model but never the key', async () => {
    const res = await app.request('/api/health', {}, createEnv({ GEMINI_API_KEY: 'secret' }));
    const body = await res.json();
    expect(body).toEqual({ status: 'ok', ai: { configured: true, provider: 'gemini', model: 'gemini-3.1-flash-lite' } });
    expect(JSON.stringify(body)).not.toContain('secret');
  });

  it('generates a flowchart end to end through the provider', async () => {
    createInteraction.mockResolvedValue({ output_text: JSON.stringify(validDiagram) });
    const res = await app.request('/api/ai/generate-flowchart', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: 'Create a workflow' }),
    }, createEnv({ GEMINI_API_KEY: 'secret' }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.diagram).toEqual(validDiagram);
    expect(createClient).toHaveBeenCalledWith({ apiKey: 'secret' });
  });

  it('returns AI_NOT_CONFIGURED when no key is present', async () => {
    const res = await app.request('/api/ai/generate-flowchart', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: 'Create a workflow' }),
    }, createEnv());
    expect(res.status).toBe(503);
    expect(await res.json()).toMatchObject({ error: { code: 'AI_NOT_CONFIGURED' } });
  });

  it('rejects a non-JSON content type', async () => {
    const res = await app.request('/api/ai/generate-flowchart', {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: 'not json',
    }, createEnv({ GEMINI_API_KEY: 'secret' }));
    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({ error: { code: 'INVALID_REQUEST' } });
  });

  it('rejects malformed JSON', async () => {
    const res = await app.request('/api/ai/generate-flowchart', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{not valid json',
    }, createEnv({ GEMINI_API_KEY: 'secret' }));
    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({ error: { code: 'INVALID_REQUEST' } });
  });

  it('rejects an oversized body', async () => {
    const res = await app.request('/api/ai/generate-flowchart', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: 'x'.repeat(9_000) }),
    }, createEnv({ GEMINI_API_KEY: 'secret' }));
    expect(res.status).toBe(413);
  });

  it('enforces the daily rate limit via KV across requests', async () => {
    createInteraction.mockResolvedValue({ output_text: JSON.stringify(validDiagram) });
    const env = createEnv({ GEMINI_API_KEY: 'secret', AI_DAILY_LIMIT: '1' });
    const request = () => app.request('/api/ai/generate-flowchart', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: 'Create a workflow' }),
    }, env);

    expect((await request()).status).toBe(200);
    const second = await request();
    expect(second.status).toBe(429);
    expect(await second.json()).toMatchObject({ error: { code: 'RATE_LIMITED' } });
  });

  it('returns a safe 404 for an unknown API route', async () => {
    const res = await app.request('/api/ai/does-not-exist', {}, createEnv());
    expect(res.status).toBe(404);
    expect(await res.json()).toMatchObject({ error: { code: 'INVALID_REQUEST' } });
  });

  it('falls through to static assets for non-API paths', async () => {
    const env = createEnv();
    const res = await app.request('/editor/some-id', {}, env);
    expect(await res.text()).toBe('<html>spa</html>');
    expect(env.ASSETS.fetch).toHaveBeenCalled();
  });
});
