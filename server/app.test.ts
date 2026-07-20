import request from 'supertest';
import { createApp } from './app';
import type { ServerConfig } from './config/env';
import { ApiError } from './middleware/errorHandler';
import type { FlowchartProvider } from './providers/geminiFlowchartProvider';
import { validAiDiagram } from '../shared/ai/aiDiagramSchema.test';

function config(overrides: Partial<ServerConfig> = {}): ServerConfig {
  return {
    port: 8787,
    geminiApiKey: undefined,
    geminiModel: 'gemini-3.1-flash-lite',
    requestTimeoutMs: 30_000,
    dailyLimit: 3,
    cooldownSeconds: 20,
    maxPromptLength: 2_000,
    maxNodes: 25,
    maxEdges: 40,
    ...overrides,
  };
}

const successfulProvider: FlowchartProvider = {
  generate: vi.fn().mockResolvedValue(validAiDiagram()),
};

describe('AI server', () => {
  it('reports health without exposing environment values', async () => {
    const response = await request(createApp({ config: config({ geminiApiKey: 'server-secret' }), provider: successfulProvider }))
      .get('/api/health');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      status: 'ok',
      ai: { configured: true, provider: 'gemini', model: 'gemini-3.1-flash-lite' },
    });
    expect(JSON.stringify(response.body)).not.toContain('server-secret');
  });

  it('reports an unconfigured provider without exposing server configuration', async () => {
    const response = await request(createApp({ config: config() })).get('/api/health');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok', ai: { configured: false } });
    expect(JSON.stringify(response.body)).not.toContain('GEMINI_API_KEY');
  });

  it('returns AI_NOT_CONFIGURED when the key is missing', async () => {
    const response = await request(createApp({ config: config() }))
      .post('/api/ai/generate-flowchart')
      .send({ prompt: 'Create an approval workflow' });
    expect(response.status).toBe(503);
    expect(response.body.error.code).toBe('AI_NOT_CONFIGURED');
  });

  it('accepts a valid prompt and returns a safe request id', async () => {
    const response = await request(createApp({ config: config(), provider: successfulProvider }))
      .post('/api/ai/generate-flowchart')
      .send({ prompt: 'Create an approval workflow' });
    expect(response.status).toBe(200);
    expect(response.body.requestId).toMatch(/^[0-9a-f-]{36}$/);
    expect(response.body.diagram.title).toBe('Approval workflow');
  });

  it.each([
    ['invalid content type', request(createApp({ config: config(), provider: successfulProvider })).post('/api/ai/generate-flowchart').set('Content-Type', 'text/plain').send('prompt'), 'INVALID_REQUEST'],
    ['empty prompt', request(createApp({ config: config(), provider: successfulProvider })).post('/api/ai/generate-flowchart').send({ prompt: '   ' }), 'INVALID_REQUEST'],
    ['unknown field', request(createApp({ config: config(), provider: successfulProvider })).post('/api/ai/generate-flowchart').send({ prompt: 'Workflow', extra: true }), 'INVALID_REQUEST'],
  ])('rejects %s', async (_name, pending, code) => {
    const response = await pending;
    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe(code);
  });

  it('rejects an oversized prompt', async () => {
    const response = await request(createApp({ config: config({ maxPromptLength: 10 }), provider: successfulProvider }))
      .post('/api/ai/generate-flowchart')
      .send({ prompt: 'This description is too long' });
    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('PROMPT_TOO_LONG');
  });

  it('rejects oversized and malformed JSON bodies safely', async () => {
    const app = createApp({ config: config(), provider: successfulProvider });
    const oversized = await request(app)
      .post('/api/ai/generate-flowchart')
      .set('Content-Type', 'application/json')
      .send(JSON.stringify({ prompt: 'x'.repeat(9_000) }));
    expect(oversized.status).toBe(413);
    expect(oversized.body.error.code).toBe('INVALID_REQUEST');

    const malformed = await request(app)
      .post('/api/ai/generate-flowchart')
      .set('Content-Type', 'application/json')
      .send('{"prompt":');
    expect(malformed.status).toBe(400);
    expect(malformed.body.error.code).toBe('INVALID_REQUEST');
  });

  it.each([
    ['timeout', new ApiError(504, 'AI_TIMEOUT', 'The AI request took too long. Please try again.'), 'AI_TIMEOUT', 504],
    ['provider error', new ApiError(502, 'AI_PROVIDER_ERROR', 'Safe provider message'), 'AI_PROVIDER_ERROR', 502],
    ['invalid response', new ApiError(502, 'INVALID_AI_RESPONSE', 'Safe invalid response message'), 'INVALID_AI_RESPONSE', 502],
  ])('normalizes a %s', async (_name, providerError, code, status) => {
    const provider: FlowchartProvider = { generate: vi.fn().mockRejectedValue(providerError) };
    const response = await request(createApp({ config: config(), provider }))
      .post('/api/ai/generate-flowchart')
      .send({ prompt: 'Workflow' });
    expect(response.status).toBe(status);
    expect(response.body.error.code).toBe(code);
    expect(JSON.stringify(response.body)).not.toContain('stack');
  });

  it('enforces cooldown and daily attempt limits', async () => {
    const cooldownApp = createApp({ config: config({ cooldownSeconds: 60 }), provider: successfulProvider });
    await request(cooldownApp).post('/api/ai/generate-flowchart').send({ prompt: 'First' }).expect(200);
    const cooldown = await request(cooldownApp).post('/api/ai/generate-flowchart').send({ prompt: 'Second' });
    expect(cooldown.status).toBe(429);
    expect(cooldown.body.error.code).toBe('RATE_LIMITED');

    const dailyApp = createApp({ config: config({ dailyLimit: 1, cooldownSeconds: 0 }), provider: successfulProvider });
    await request(dailyApp).post('/api/ai/generate-flowchart').send({ prompt: 'First' }).expect(200);
    const daily = await request(dailyApp).post('/api/ai/generate-flowchart').send({ prompt: 'Second' });
    expect(daily.status).toBe(429);
    expect(daily.body.error.message).toContain('today');
  });
});
